import {connectConsumer} from '../connect';
import {provideNativeReading} from './native-reading';
export const dispose = connectConsumer(host => provideNativeReading(host, window).dispose);
