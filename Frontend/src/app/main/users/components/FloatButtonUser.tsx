import Button from '@fuse/ui/Button';
import { HiPlus } from 'react-icons/hi';
/* Store */
import { useAppDispatch } from 'app/store';
import { openNewUserDialog } from '../store/userSlice';

function FloatButtonUser() {
  const dispatch = useAppDispatch();

  return (
    <Button
      className="fixed right-5 bottom-5 z-30 md:hidden"
      variant="solid"
      shape="circle"
      size="lg"
      icon={<HiPlus />}
      onClick={() => dispatch(openNewUserDialog({}))}
    />
  );
}

export default FloatButtonUser;
