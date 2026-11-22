import {connectConsumer} from '../../../framework/connect';
import {createWeather, mountEffects} from '../effects/effects';
import '../effects/style.css';

connectConsumer(host => {
  const provider = host.register('Host5Atmosphere');
  let weather: ReturnType<typeof createWeather> | undefined;
  let sequence = 0;
  const dispose = () => {
    provider.dispose(); // Release published views and their painters before shared state.
    weather?.dispose();
  };
  try {
    const shared = createWeather(host);
    weather = shared;
    const names = {sunny: '晴', rain: '雨', snow: '雪'} as const;
    for (const key of ['sunny', 'rain', 'snow'] as const) {
      provider.provideCommand({id: key, title: names[key], schema: 'host5.weather.preview', run() {
        shared.set(key);
        return key;
      }});
    }
    provider.provideView({id: 'surface', title: '天气效果', setup(context) {
      const surface = mountEffects(host, `AtmosphereSurface${++sequence}`, context.element, shared);
      context.onCleanup(surface.dispose);
    }});
  } catch (error) {
    dispose();
    throw error;
  }
  return dispose;
});
