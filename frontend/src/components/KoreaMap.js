import React from 'react';
import Svg, { Path, Text as SvgText, G, Rect } from 'react-native-svg';
import { PROVINCES } from '../assets/regions';
import { PROVINCE_PATHS } from '../assets/koreaPaths';
import { colors } from '../theme';

export default function KoreaMap({ counts = {}, onSelect }) {
  return (
    <Svg viewBox="0 0 800 759" width="100%" height="100%">
      {/* 바다 배경 */}
      <Rect x="0" y="0" width="800" height="759" fill="#C8DFF0" />

      {PROVINCES.map((p) => {
        const pathData = PROVINCE_PATHS[p.name];
        if (!pathData) return null;

        const count = counts[p.name] || 0;
        const hasContent = count > 0;
        const fill = hasContent ? colors.primaryLight : '#F5F5EE';
        const stroke = hasContent ? colors.primary : '#AAAAAA';

        return (
          <G key={p.id} onPress={() => onSelect(p)}>
            <Path
              d={pathData.path}
              fill={fill}
              stroke={stroke}
              strokeWidth={1}
            />
            <SvgText
              x={pathData.cx}
              y={pathData.cy + 4}
              fontSize={p.short.length > 2 ? 9 : 11}
              fontWeight="600"
              fill={colors.text}
              textAnchor="middle"
            >
              {p.short}
            </SvgText>
            {hasContent && (
              <SvgText
                x={pathData.cx}
                y={pathData.cy + 17}
                fontSize={8}
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
