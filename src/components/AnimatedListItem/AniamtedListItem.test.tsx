import { renderComponent } from '__tests__/renderComponent';

import { AnimatedListItem } from '.';

describe('AnimatedListItem', () => {
  it('should render', () => {
    renderComponent(
      <AnimatedListItem>
        <div>Hello</div>
      </AnimatedListItem>
    );
  });
});

export default AnimatedListItem;
