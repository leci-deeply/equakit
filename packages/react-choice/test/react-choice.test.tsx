import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { InteractiveChoices } from '../src/index.js';

describe('@equakit/react-choice', () => {
  it('渲染可访问的受控选项和结果状态', () => {
    const html = renderToStaticMarkup(
      <InteractiveChoices
        choices={['$1$', '$2$']}
        correct={['1']}
        onChange={() => undefined}
        reveal
        selected={['0']}
      />,
    );
    expect(html).toContain('type="radio"');
    expect(html).toContain('<legend');
    expect(html).toContain('选择答案');
    expect(html).toContain('mre-interactive-choices__item--wrong');
    expect(html).toContain('mre-interactive-choices__item--correct');
    expect(html).toContain('aria-invalid="true"');
  });

  it('多选模式使用 checkbox 和独立 name', () => {
    const html = renderToStaticMarkup(
      <InteractiveChoices
        choices={[
          { id: 'a', content: '$1$' },
          { id: 'b', content: '$2$' },
        ]}
        multiple
        onChange={() => undefined}
        selected={['a']}
      />,
    );
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('name="mre-choice-a"');
    expect(html).toContain('mre-interactive-choices__item--selected');
  });
});
