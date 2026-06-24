import { PageContainer } from "@/components/layout/PageContainer";
import { SignUpForm } from "@/components/auth/sign-up-form";

export default function RegisterPage() {
  return (
    <PageContainer
      as="main"
      className="flex min-h-[calc(100vh-4rem)] items-center justify-center"
    >
      <SignUpForm />
    </PageContainer>
  );
}
