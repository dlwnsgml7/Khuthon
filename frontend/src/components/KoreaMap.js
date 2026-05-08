import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, PanResponder, StyleSheet } from 'react-native';
import Svg, { Path, Text as SvgText, G, Rect } from 'react-native-svg';
import { PROVINCES, CITIES_BY_PROVINCE } from '../assets/regions';
import { PROVINCE_PATHS } from '../assets/koreaPaths';
import { CITY_PATHS } from '../assets/cityPaths';

// SVG 도시명(예: "포항시 남구") → DB 기본 도시명(예: "포항시") 변환
function getBaseCity(svgCity, provinceName) {
  const cities = CITIES_BY_PROVINCE[provinceName] || [];
  return cities.find(c => svgCity.startsWith(c)) || svgCity;
}

// cityCounts에서 SVG 도시에 해당하는 카운트 조회 (접두어 매칭)
function getCityCount(svgCity, provinceName, cityCounts) {
  if (cityCounts[svgCity]) return cityCounts[svgCity];
  const base = getBaseCity(svgCity, provinceName);
  return cityCounts[base] || 0;
}

// ─── Design tokens ───────────────────────────────────────────────────────────
const C = {
  ocean:      '#2C2C34',  // 앱 배경보다 밝은 다크 (지도 영역 구분)
  stroke:     '#48484E',  // 도 경계선
  strokeCity: '#525258',  // 시 경계선
  labelBase:  '#8E8E93',  // 코스 없는 도 레이블
  labelHas:   '#FFFFFF',  // 코스 있는 도 레이블
};

// 도별 색 계열 (base: 코스 없음, has: 코스 있음) — 밝기 올림
const REGION_COLOR = {
  '서울특별시':     { base: '#3A4258', has: '#2E72CC' },  // 파랑 계열
  '인천광역시':     { base: '#3A4258', has: '#2E72CC' },
  '경기도':         { base: '#3E4860', has: '#3278D0' },
  '강원특별자치도': { base: '#48402E', has: '#9A6832' },  // 웜 앰버 계열
  '충청북도':       { base: '#304440', has: '#258060' },  // 틸 계열
  '충청남도':       { base: '#304440', has: '#258060' },
  '대전광역시':     { base: '#304440', has: '#258060' },
  '세종특별자치시': { base: '#304440', has: '#258060' },
  '경상북도':       { base: '#383244', has: '#6040A0' },  // 퍼플 계열
  '대구광역시':     { base: '#383244', has: '#6040A0' },
  '경상남도':       { base: '#303450', has: '#2860B0' },  // 네이비 계열
  '부산광역시':     { base: '#303450', has: '#2860B0' },
  '울산광역시':     { base: '#303450', has: '#2860B0' },
  '전북특별자치도': { base: '#403434', has: '#904040' },  // 레드 계열
  '전라남도':       { base: '#403434', has: '#904040' },
  '광주광역시':     { base: '#403434', has: '#904040' },
  '제주특별자치도': { base: '#2A3C38', has: '#208860' },  // 틸 계열
};

const SHORT = {
  '서울특별시':'서울','부산광역시':'부산','대구광역시':'대구','인천광역시':'인천',
  '광주광역시':'광주','대전광역시':'대전','울산광역시':'울산','세종특별자치시':'세종',
  '경기도':'경기','강원특별자치도':'강원','충청북도':'충북','충청남도':'충남',
  '전북특별자치도':'전북','전라남도':'전남','경상북도':'경북','경상남도':'경남',
  '제주특별자치도':'제주',
};

// Korea bounds in the 800x759 SVG space
const KOREA = { x: 88, y: 48, w: 494, h: 710 };
const MIN_SCALE = 1;
const MAX_SCALE = 6;
const ZOOM_STEP = 1.35;

function parseViewBox(viewBox) {
  const [x, y, w, h] = viewBox.split(/\s+/).map(Number);
  return { x, y, w, h };
}

function fitViewBox(bounds, cw, ch) {
  if (!cw || !ch) return { ...bounds };
  const ratio = cw / ch;
  const kr = bounds.w / bounds.h;
  let x, y, w, h;
  if (ratio < kr) {
    w = bounds.w; h = w / ratio;
    x = bounds.x; y = bounds.y + bounds.h / 2 - h / 2;
  } else {
    h = bounds.h; w = h * ratio;
    y = bounds.y; x = bounds.x + bounds.w / 2 - w / 2;
  }
  return { x, y, w, h };
}

function clampValue(value, min, max) {
  if (min > max) return min + (max - min) / 2;
  return Math.max(min, Math.min(max, value));
}

function clampVb(vb, base, bounds) {
  const scale = base.w / vb.w;
  const clampedScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale));
  const w = base.w / clampedScale;
  const h = base.h / clampedScale;
  const pad = Math.min(bounds.w, bounds.h) * 0.03;
  const x = clampValue(vb.x, bounds.x - pad, bounds.x + bounds.w + pad - w);
  const y = clampValue(vb.y, bounds.y - pad, bounds.y + bounds.h + pad - h);
  return { x, y, w, h };
}

function zoomViewBox(vb, base, bounds, factor, focal = { x: 0.5, y: 0.5 }) {
  const newW = vb.w / factor;
  const newH = vb.h / factor;
  const fSvgX = vb.x + focal.x * vb.w;
  const fSvgY = vb.y + focal.y * vb.h;
  return clampVb({
    x: fSvgX - focal.x * newW,
    y: fSvgY - focal.y * newH,
    w: newW,
    h: newH,
  }, base, bounds);
}

function getTouchCenter(touches) {
  const total = touches.reduce((acc, touch) => ({
    x: acc.x + touch.locationX,
    y: acc.y + touch.locationY,
  }), { x: 0, y: 0 });
  return { x: total.x / touches.length, y: total.y / touches.length };
}

function getTouchDistance(touches) {
  if (touches.length < 2) return 0;
  const [a, b] = touches;
  return Math.hypot(a.locationX - b.locationX, a.locationY - b.locationY);
}

// 자동 계산된 무게중심이 부정확한 도에 대한 레이블 위치 수동 보정
// (섬 포함 지형이 무게중심을 당기거나, 인접 도와 겹치는 경우)
const LABEL_POS = {
  '서울특별시':     { cx: 258, cy: 152 },  // 작은 영역, 살짝 아래
  '인천광역시':     { cx: 236, cy: 167 },  // 서쪽 섬들이 cx=120으로 당김 → 내륙으로 이동
  '경기도':         { cx: 295, cy: 182 },  // 서울과 겹침 방지 → 남동쪽으로 이동
  '충청북도':       { cx: 358, cy: 278 },  // 미세 조정
  '경상북도':       { cx: 488, cy: 286 },  // 동쪽 치우침 보정
};

// ─── Korea overview SVG ───────────────────────────────────────────────────────
function KoreaOverview({ counts, onSelect, vb }) {
  const vbStr = `${vb.x} ${vb.y} ${vb.w} ${vb.h}`;
  return (
    <Svg viewBox={vbStr} width="100%" height="100%">
      <Rect x="-9999" y="-9999" width="99999" height="99999" fill={C.ocean} />
      {/* 1st pass: 모든 Path */}
      {PROVINCES.map((p) => {
        const pd = PROVINCE_PATHS[p.name];
        if (!pd) return null;
        const has = (counts[p.name] || 0) > 0;
        const zoom = Math.max(1, KOREA.w / vb.w);
        const rc = REGION_COLOR[p.name] || { base: '#242428', has: '#1A4A80' };
        return (
          <G key={`path-${p.id}`} onPress={() => onSelect(p)}>
            <Path
              d={pd.path}
              fill={has ? rc.has : rc.base}
              stroke={C.stroke}
              strokeWidth={0.8 / zoom}
            />
          </G>
        );
      })}
      {/* 2nd pass: 레이블 (항상 위에) */}
      {PROVINCES.map((p) => {
        const pd = PROVINCE_PATHS[p.name];
        if (!pd) return null;
        const count = counts[p.name] || 0;
        const has = count > 0;
        const short = SHORT[p.name] || p.name;
        const zoom = Math.max(1, KOREA.w / vb.w);
        const fs = Math.round((short.length > 2 ? 13 : 15) / zoom);
        const lp = LABEL_POS[p.name] || pd;
        return (
          <G key={`label-${p.id}`} onPress={() => onSelect(p)}>
            <SvgText x={lp.cx} y={lp.cy + 4} fontSize={Math.max(8, fs)}
              fontWeight="700" fill={has ? C.labelHas : C.labelBase} textAnchor="middle">
              {short}
            </SvgText>
            {has && (
              <SvgText x={lp.cx} y={lp.cy + 4 + Math.max(8, fs) + 3}
                fontSize={Math.max(6, Math.round(11 / zoom))}
                fill={C.labelHas} textAnchor="middle">{count}</SvgText>
            )}
          </G>
        );
      })}
    </Svg>
  );
}

// ─── Province detail SVG ─────────────────────────────────────────────────────
function ProvinceDetail({ province, cityCounts, onSelectCity, vb }) {
  const pd = CITY_PATHS[province.name];
  if (!pd) return null;
  const { viewBox, cities } = pd;
  const vbStr = vb ? `${vb.x} ${vb.y} ${vb.w} ${vb.h}` : viewBox;
  const base = parseViewBox(viewBox);
  const zoom = Math.max(1, base.w / (vb?.w || base.w));
  return (
    <Svg viewBox={vbStr} width="100%" height="100%">
      <Rect x="-9999" y="-9999" width="99999" height="99999" fill={C.ocean} />
      {(() => {
        const shownBaseCities = new Set();
        return Object.entries(cities).map(([cityName, cityData]) => {
          const count = getCityCount(cityName, province.name, cityCounts);
          const has = count > 0;
          const label = cityName.length > 4 ? cityName.slice(0, 3) + '…' : cityName;
          const fs = Math.max(7, Math.round((label.length > 3 ? 11 : 13) / zoom));
          const baseCity = getBaseCity(cityName, province.name);
          const showCount = has && !shownBaseCities.has(baseCity);
          if (showCount) shownBaseCities.add(baseCity);
          const rc = REGION_COLOR[province.name] || { base: '#242428', has: '#1A4A80' };
          return (
            <G key={cityName} onPress={() => onSelectCity(baseCity)}>
              <Path
                d={cityData.path}
                fill={has ? rc.has : rc.base}
                stroke={C.strokeCity}
                strokeWidth={Math.max(0.6, 1.2 / zoom)}
              />
              <SvgText x={cityData.cx} y={cityData.cy + 4} fontSize={fs}
                fontWeight="600" fill={has ? C.labelHas : C.labelBase} textAnchor="middle">{label}</SvgText>
              {showCount && (
                <SvgText x={cityData.cx} y={cityData.cy + 4 + fs + 3} fontSize={Math.max(6, Math.round(10 / zoom))}
                  fill={C.labelHas} textAnchor="middle">{count}</SvgText>
              )}
            </G>
          );
        });
      })()}
    </Svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function KoreaMap({ counts = {}, cityCounts = {}, onSelectCity, onProvinceSelect }) {
  const [selected, setSelected]       = useState(null);
  const [overviewVb, setOverviewVb]   = useState(null);
  const [detailVb, setDetailVb]       = useState(null);

  // refs for touch calculations (avoid stale closures)
  const overviewVbRef   = useRef(null);
  const detailVbRef     = useRef(null);
  const overviewBaseRef = useRef(null);
  const detailBaseRef   = useRef(null);
  const detailBoundsRef = useRef(null);
  const layoutRef       = useRef({ w: 0, h: 0 });
  const selectedRef     = useRef(null);
  const touchStart      = useRef(null);

  const fadeOv        = useRef(new Animated.Value(1)).current;
  const fadeDet       = useRef(new Animated.Value(0)).current;
  const activeScaleRef = useRef(1);

  selectedRef.current = selected;

  const getActiveMap = () => {
    if (selectedRef.current) {
      return {
        vb: detailVbRef.current,
        base: detailBaseRef.current,
        bounds: detailBoundsRef.current,
        setVb: (next) => {
          detailVbRef.current = next;
          setDetailVb(next);
        },
      };
    }
    return {
      vb: overviewVbRef.current,
      base: overviewBaseRef.current,
      bounds: KOREA,
      setVb: (next) => {
        overviewVbRef.current = next;
        setOverviewVb(next);
      },
    };
  };

  const activeScale = (() => {
    const active = getActiveMap();
    return active.vb && active.base ? active.base.w / active.vb.w : 1;
  })();
  activeScaleRef.current = activeScale;

  const prepareDetailView = (provinceName) => {
    const provinceMap = CITY_PATHS[provinceName];
    if (!provinceMap) return;
    const bounds = parseViewBox(provinceMap.viewBox);
    const base = fitViewBox(bounds, layoutRef.current.w, layoutRef.current.h);
    detailBoundsRef.current = bounds;
    detailBaseRef.current = base;
    detailVbRef.current = base;
    setDetailVb(base);
  };

  const handleLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    layoutRef.current = { w: width, h: height };
    const base = fitViewBox(KOREA, width, height);
    overviewBaseRef.current = base;
    if (!overviewVbRef.current) {
      overviewVbRef.current = base;
      setOverviewVb(base);
    }

    if (selectedRef.current) {
      prepareDetailView(selectedRef.current.name);
    }
  };

  const zoomBy = (factor, focal) => {
    const active = getActiveMap();
    if (!active.vb || !active.base || !active.bounds) return;
    active.setVb(zoomViewBox(active.vb, active.base, active.bounds, factor, focal));
  };

  const resetZoom = () => {
    const active = getActiveMap();
    if (!active.base) return;
    active.setVb({ ...active.base });
  };

  const panResponder = useRef(PanResponder.create({
    // 2손가락이면 즉시 클레임 (SVG에 뺏기기 전에)
    onStartShouldSetPanResponder: (evt) => {
      const touches = evt.nativeEvent.touches || [];
      return touches.length >= 2;
    },
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      const touches = evt.nativeEvent.touches || [];
      return touches.length >= 2
        || (activeScaleRef.current > MIN_SCALE && (Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4));
    },
    onPanResponderGrant: (evt, gestureState) => {
      const active = getActiveMap();
      const touches = evt.nativeEvent.touches || [];
      if (!active.vb || !active.base || !active.bounds || !touches.length) return;
      touchStart.current = {
        vb: { ...active.vb },
        distance: getTouchDistance(touches),
        center: getTouchCenter(touches),
        dx: gestureState.dx,
        dy: gestureState.dy,
      };
    },
    onPanResponderMove: (evt, gestureState) => {
      const active = getActiveMap();
      const touches = evt.nativeEvent.touches || [];
      if (!active.vb || !active.base || !active.bounds || !touches.length) return;

      if (!touchStart.current) {
        touchStart.current = {
          vb: { ...active.vb },
          distance: getTouchDistance(touches),
          center: getTouchCenter(touches),
          dx: gestureState.dx,
          dy: gestureState.dy,
        };
      }

      const { w: cw, h: ch } = layoutRef.current;
      const { vb: startVb, distance, center, dx: startDx, dy: startDy } = touchStart.current;

      if (touches.length >= 2 && distance > 0) {
        const factor = getTouchDistance(touches) / distance;
        active.setVb(zoomViewBox(startVb, active.base, active.bounds, factor, {
          x: center.x / cw,
          y: center.y / ch,
        }));
        return;
      }

      if (touches.length >= 2) {
        touchStart.current = {
          vb: { ...active.vb },
          distance: getTouchDistance(touches),
          center: getTouchCenter(touches),
          dx: gestureState.dx,
          dy: gestureState.dy,
        };
        return;
      }

      const dx = -((gestureState.dx - startDx) / cw) * startVb.w;
      const dy = -((gestureState.dy - startDy) / ch) * startVb.h;
      active.setVb(clampVb({
        x: startVb.x + dx,
        y: startVb.y + dy,
        w: startVb.w,
        h: startVb.h,
      }, active.base, active.bounds));
    },
    onPanResponderRelease: () => { touchStart.current = null; },
    onPanResponderTerminate: () => { touchStart.current = null; },
  })).current;

  // ── Province selection ─────────────────────────────────────────────────────
  const pickProvince = (p) => {
    selectedRef.current = p;
    prepareDetailView(p.name);
    setSelected(p);
    onProvinceSelect?.(p.name);
    Animated.parallel([
      Animated.timing(fadeOv,  { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(fadeDet, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  };

  const goBack = () => {
    Animated.parallel([
      Animated.timing(fadeOv,  { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(fadeDet, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      selectedRef.current = null;
      setSelected(null);
    });
  };

  if (!overviewVb) {
    return <View style={s.root} onLayout={handleLayout} />;
  }

  return (
    <View style={s.root} onLayout={handleLayout}>
      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
        {/* Korea overview */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeOv }]}
          pointerEvents={selected ? 'none' : 'auto'}>
          <KoreaOverview counts={counts} onSelect={pickProvince} vb={overviewVb} />
        </Animated.View>

        {/* Province detail */}
        {selected && (
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeDet }]}
            pointerEvents={selected ? 'auto' : 'none'}>
            <ProvinceDetail province={selected} cityCounts={cityCounts} vb={detailVb}
              onSelectCity={(city) => onSelectCity?.(selected.name, city)} />
          </Animated.View>
        )}
      </View>

      {/* Province name + back button overlay */}
      {selected && (
        <View style={s.topBar} pointerEvents="box-none">
          <View style={s.topCard}>
            <TouchableOpacity onPress={goBack} style={s.backBtn}>
              <Text style={s.backText}>← 전체지도</Text>
            </TouchableOpacity>
            <Text style={s.topTitle}>{selected.name}</Text>
            <View style={s.backBtn} />
          </View>
        </View>
      )}

      <View style={s.zoomBar} pointerEvents="box-none">
        <TouchableOpacity
          accessibilityLabel="지도 확대"
          disabled={activeScale >= MAX_SCALE - 0.01}
          onPress={() => zoomBy(ZOOM_STEP)}
          style={[s.zoomBtn, activeScale >= MAX_SCALE - 0.01 && s.zoomBtnDisabled]}
        >
          <Text style={s.zoomText}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel="지도 축소"
          disabled={activeScale <= MIN_SCALE + 0.01}
          onPress={() => zoomBy(1 / ZOOM_STEP)}
          style={[s.zoomBtn, activeScale <= MIN_SCALE + 0.01 && s.zoomBtnDisabled]}
        >
          <Text style={s.zoomText}>-</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.ocean },
  topBar:     { position: 'absolute', top: 12, left: 12, right: 12 },
  topCard:    {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(20,18,14,0.97)', borderRadius: 18,
    paddingHorizontal: 16, paddingVertical: 11,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
  },
  backBtn:    { width: 80 },
  backText:   { fontSize: 13, color: '#0A84FF', fontWeight: '700', letterSpacing: -0.2 },
  topTitle:   { fontSize: 15, fontWeight: '700', color: '#F2F2F7', textAlign: 'center', letterSpacing: -0.3 },
  zoomBar:    {
    position: 'absolute', right: 14, bottom: 74,
    borderRadius: 14, overflow: 'hidden',
    backgroundColor: 'rgba(20,18,14,0.96)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10, shadowRadius: 12, elevation: 4,
  },
  zoomBtn:    {
    width: 44, height: 44, alignItems: 'center', justifyContent: 'center',
    borderBottomWidth: 1, borderBottomColor: '#3A3A3E',
  },
  zoomBtnDisabled: { opacity: 0.25 },
  zoomText:   { fontSize: 22, lineHeight: 26, color: '#0A84FF', fontWeight: '300' },
  bottomBar:  { position: 'absolute', bottom: 14, left: 0, right: 0, alignItems: 'center' },
  legendCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(20,18,14,0.94)', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 2,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot:        { width: 9, height: 9, borderRadius: 3, borderWidth: 1, borderColor: '#C8BCAC' },
  legendText: { fontSize: 11, color: '#8E8E93', letterSpacing: -0.1 },
  resetBtn:   { backgroundColor: '#0A84FF', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  resetText:  { fontSize: 11, color: '#fff', fontWeight: '600', letterSpacing: 0.1 },
});
