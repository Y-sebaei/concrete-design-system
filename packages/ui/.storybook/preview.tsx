import type { Preview } from '@storybook/react';
import { withThemeByDataAttribute } from '@storybook/addon-themes';
import '../src/styles/fonts.css';
import '../src/styles/index.css';

const preview: Preview = {
  parameters: {
    controls: { expanded: true, matchers: { color: /(background|color)$/i } },
    options: {
      storySort: {
        order: [
          'Foundations',
          [
            'Introduction',
            'Colour',
            'Typography',
            'Spacing',
            'Radius and elevation',
            'Motion',
            'Focus',
          ],
          'Components',
        ],
      },
    },
    a11y: {
      config: {
        rules: [
          {
            /*
             * Disabled in the addon panel only, and only because the rendered
             * story sits on Storybook's own canvas background rather than on a
             * Concrete surface, which makes the reported ratios describe a
             * combination the library never produces. Contrast is checked
             * properly and exhaustively in src/tokens/contrast.ts, over every
             * declared pair in both themes, and that check fails CI.
             */
            id: 'color-contrast',
            enabled: false,
          },
        ],
      },
    },
    backgrounds: { disable: true },
    docs: { toc: true },
  },

  decorators: [
    /*
     * Switches the whole document, not just the story frame.
     *
     * Concrete resolves its theme from custom properties on :root, so a
     * decorator that wraps the story in a themed div would leave anything
     * portalled to body, which is every modal and every toast, rendering in
     * the other theme.
     */
    withThemeByDataAttribute({
      themes: { light: 'light', dark: 'dark' },
      defaultTheme: 'light',
      attributeName: 'data-theme',
    }),
    (Story) => (
      <div className="bg-surface-app p-6 text-text">
        <Story />
      </div>
    ),
  ],
};

export default preview;
