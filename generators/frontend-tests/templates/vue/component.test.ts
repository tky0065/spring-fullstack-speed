import { mount } from '@vue/test-utils';
import { describe, it, expect } from 'vitest';
import <%= componentName %> from '../components/<%= componentName %>.vue';

describe('<%= componentName %>', () => {
  it('renders properly with default props', () => {
    const wrapper = mount(<%= componentName %>, {
      props: {
        label: 'Click me'
      }
    });
    expect(wrapper.text()).toContain('Click me');
    expect(wrapper.find('button').exists()).toBe(true);
  });

  it('emits click event when clicked', async () => {
    const wrapper = mount(<%= componentName %>, {
      props: {
        label: 'Click me'
      }
    });

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted()).toHaveProperty('click');
    expect(wrapper.emitted().click).toHaveLength(1);
  });

  it('applies primary class when type is primary', () => {
    const wrapper = mount(<%= componentName %>, {
      props: {
        label: 'Primary Button',
        type: 'primary'
      }
    });

    expect(wrapper.find('button').classes()).toContain('btn-primary');
  });

  it('does not emit click event when disabled', async () => {
    const wrapper = mount(<%= componentName %>, {
      props: {
        label: 'Click me',
        disabled: true
      }
    });

    expect(wrapper.find('button').attributes('disabled')).toBeDefined();

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted().click).toBeUndefined();
  });

  it('applies custom class when provided', () => {
    const wrapper = mount(<%= componentName %>, {
      props: {
        label: 'Custom Button',
        className: 'my-custom-class'
      }
    });

    expect(wrapper.find('button').classes()).toContain('my-custom-class');
  });
});
