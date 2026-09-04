import { memo } from 'react';
import Container from '@fuse/shared/Container';
import classNames from '@fuse/ui/utils/classNames';

export type FooterPageContainerType = 'gutterless' | 'contained';

type FooterProps = {
  pageContainerType: FooterPageContainerType;
  className?: string;
};

const FooterContent = () => {
  return (
    <div className="flex w-full flex-auto items-center justify-between">
      <span>
        Copyright &copy; {`${new Date().getFullYear()}`}{' '}
        <span className="font-semibold">Flashcards</span> Todos os direitos reservados.
      </span>
      <div className="">
        <a className="text-gray" href="/#" onClick={(e) => e.preventDefault()}>
          Termos e Condições
        </a>
        <span className="text-muted mx-2"> | </span>
        <a className="text-gray" href="/#" onClick={(e) => e.preventDefault()}>
          Privacidade e Política
        </a>
      </div>
    </div>
  );
};

/**
 * The footer layout.
 */
function FooterLayout({ pageContainerType = 'contained', className }: FooterProps) {
  return (
    <footer
      className={classNames(
        `footer flex h-16 flex-auto items-center px-4 sm:px-6 md:px-8`,
        className
      )}
    >
      {pageContainerType === 'contained' ? (
        <Container>
          <FooterContent />
        </Container>
      ) : (
        <FooterContent />
      )}
    </footer>
  );
}

export default memo(FooterLayout);
