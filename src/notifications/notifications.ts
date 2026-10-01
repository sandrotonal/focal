import { Platform } from 'react-native';
import * as nativeModule from './notifications.native';
import * as webModule from './notifications.web';

const isWeb = Platform.OS === 'web';
const active = isWeb ? webModule : nativeModule;

export const requestNotificationPermission = active.requestNotificationPermission;
export const scheduleFocusCompletion = active.scheduleFocusCompletion;
export const cancelFocusCompletion = active.cancelFocusCompletion;
