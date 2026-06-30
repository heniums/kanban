import { PageContainer } from "@/components/layout/PageContainer";
import { SignInForm } from "@/components/auth/sign-in-form";

export default function LoginPage() {
  return (
    <PageContainer as="main" className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
      <SignInForm />
    </PageContainer>
  );
}
