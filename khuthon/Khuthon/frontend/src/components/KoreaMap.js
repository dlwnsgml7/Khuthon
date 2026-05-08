import React from 'react';
import Svg, { Rect, Text as SvgText, G } from 'react-native-svg';
import { PROVINCES } from '../assets/regions';
import { colors } from '../theme';

// 한반도 지도 - 17개 광역 행정구역을 단순화된 박스로 표현
// 실제 지도 정밀도보다 인터랙션과 가독성을 우선시
export default function KoreaMap({ counts = {}, onSelect }) {
  return (
    <Svg viewBox="80 40 420 540" width="100%" height="100%">
      {/* 바다 배경 */}
      <Rect x="80" y="40" width="420" height="540" fill="#EAF3F7" />

      {PROVINCES.map((p) => {
        const count = counts[p.name] || 0;
        const hasContent = count > 0;
        const fill = hasContent ? colors.primaryLight : '#FFFFFF';
        const stroke = hasContent ? colors.primary : '#C8C8C0';

        return (
          <G
            key={p.id}
            onPress={() => onSelect(p)}
          >
            <Rect
              x={p.x}
              y={p.y}
              width={p.w}
              height={p.h}
              fill={fill}
              stroke={stroke}
              strokeWidth={1.2}
              rx={4}
            />
            <SvgText
              x={p.x + p.w / 2}
              y={p.y + p.h / 2 + 4}
              fontSize={p.short.length > 2 ? 10 : 12}
              fontWeight="600"
              fill={colors.text}
              textAnchor="middle"
            >
              {p.short}
            </SvgText>
            {hasContent && (
              <SvgText
                x={p.x + p.w / 2}
                y={p.y + p.h / 2 + 18}
                fontSize={9}
                fill={colors.primaryDark}
                textAnchor="middle"
              >
                {count}개
              </SvgText>
            )}
          </G>
        );
      })}
    </Svg>
  );
}
