import { createFileRoute } from "@tanstack/react-router";
import * as m from "@/paraglide/messages";
import { PageSingleLayout } from "@/shared/components/layouts/page-single-layout";
import { seoMeta } from "@/shared/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () => seoMeta({ title: m["terms.title"](), description: "Termos de uso da plataforma." }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PageSingleLayout title={m["terms.title"]()}>
      <div className="space-y-4 text-muted-foreground">
        <p>
          Bem-vindo ao nosso sistema. Ao utilizar esta plataforma, você concorda com os seguintes
          termos.
        </p>
        <h2 className="text-lg font-semibold text-foreground">1. Aceitação dos Termos</h2>
        <p>
          Ao acessar ou usar o serviço, você concorda em cumprir estes termos. Se não concordar, não
          utilize a plataforma.
        </p>
        <h2 className="text-lg font-semibold text-foreground">2. Uso Permitido</h2>
        <p>
          O sistema destina-se exclusivamente a fins acadêmicos e de pesquisa. É proibido o uso
          comercial não autorizado.
        </p>
        <h2 className="text-lg font-semibold text-foreground">3. Contas de Usuário</h2>
        <p>
          Você é responsável por manter a confidencialidade de suas credenciais. Notifique-nos
          imediatamente sobre qualquer uso não autorizado.
        </p>
        <h2 className="text-lg font-semibold text-foreground">4. Limitação de Responsabilidade</h2>
        <p>
          Não nos responsabilizamos por danos indiretos ou consequenciais decorrentes do uso do
          serviço.
        </p>
        <h2 className="text-lg font-semibold text-foreground">5. Modificações</h2>
        <p>
          Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações
          significativas serão notificadas.
        </p>
      </div>
    </PageSingleLayout>
  );
}
