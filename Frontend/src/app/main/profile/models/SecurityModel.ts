import _ from '@lodash';
import type { DeepPartial } from 'react-hook-form';
import type { SecurityType } from '../types/SecurityType';

/**
 * The security model.
 */
const SecurityModel = (data?: DeepPartial<SecurityType>): SecurityType =>
  _.defaults(data || {}, {
    id: _.uniqueId(),
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

export default SecurityModel;
