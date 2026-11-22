import {connectConsumer} from '../../../framework/connect';
import type {MountHandle, View} from '../../../framework/contracts';

// A separate Mod consumes the installed presentation capability using only the Host SDK.
connectConsumer(host => {
  const owner = host.register('Host5Observatory');
  let sequence = 0;
  try {
    owner.provideView({id: 'observatory', title: '天气观测台', setup(context) {
      const doc = context.element.ownerDocument;
      const choices = doc.createElement('div');
      choices.setAttribute('role', 'group');
      choices.setAttribute('aria-label', '预览天气');
      const outlet = doc.createElement('div');
      context.element.append(choices, outlet);
      const instance = `ObservatoryPreview${++sequence}`;
      let previous: View['mount'] | undefined;
      let surface: Readonly<MountHandle> | null = null;
      function bindView() {
        const view = host.views().find(v => v.owner === 'Host5Atmosphere' && v.id === 'surface');
        if (previous === view?.mount) return;
        surface?.dispose();
        previous = view?.mount;
        surface = view?.mount({id: instance, parent: outlet, lifetime:'persistent'}) ?? null;
      }
      function bindCommands() {
        choices.replaceChildren();
        for (const command of host.commands('host5.weather.preview').filter(c => c.owner === 'Host5Atmosphere')) {
          const button = doc.createElement('button');
          button.type = 'button';
          button.textContent = command.title;
          button.onclick = () => {void command.invoke(context.binding())};
          choices.append(button);
        }
      }
      context.onCleanup(host.onCommands(bindCommands));
      context.onCleanup(host.onViews(bindView));
      context.onCleanup(() => surface?.dispose());
      bindView();
      bindCommands();
    }});
  } catch (error) {
    owner.dispose();
    throw error;
  }
  return owner.dispose;
});
