import _ from '@lodash';
import type { DeepPartial } from 'react-hook-form';
import type { ProfileType } from '../types/ProfileType';

/**
 * The profile model.
 */
const ProfileModel = (data?: DeepPartial<ProfileType>): ProfileType =>
  _.defaults(data || {}, {
    id: _.uniqueId(),
    name: '',
    email: '',
  });

export default ProfileModel;
