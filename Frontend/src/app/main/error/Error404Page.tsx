import Container from '@fuse/shared/Container';
import ActionLink from '@fuse/shared/ActionLink';
import SpaceSignBoard from './SpaceSignBoard';

function Error404Page() {
  return (
    <Container className="h-full">
      <div className="flex h-full flex-col items-center justify-center">
        <SpaceSignBoard height={280} width={280} />
        <div className="mt-10 text-center">
          <h3 className="mb-2">Ooops... 404!</h3>
          <p className="text-base">A página solicitada não pôde ser encontrada.</p>
        </div>

        <ActionLink to="/" className="heading-text mt-2 font-semibold underline" themeColor={false}>
          Voltar para página inicial
        </ActionLink>
      </div>
    </Container>
  );
}

export default Error404Page;
