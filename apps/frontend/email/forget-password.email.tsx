import {
    Html,
    Button,
    Text,
    Head,
    Preview,
    Body,
    Container,
    Section,
    Tailwind,
  } from "@react-email/components";
  
  const ForgotPasswordEmail = ({
    projectName = "My Awesome Project",
    email = "user@example.com",
    link = "https://example.com/reset-password",
  }) => {
    return (
      <Html>
        <Head />
        <Preview>Reset your password for {projectName}</Preview>
        <Tailwind>
          <Body className="bg-gray-100 font-sans">
            <Container className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto mt-10">
              <Text className="text-2xl font-bold text-gray-800 mb-4">
                Forgot Your Password?
              </Text>
              <Text className="text-gray-700 mb-4">
                Hi there, we received a request to reset your password for your{" "}
                {projectName} account associated with {email}.
              </Text>
              <Text className="text-gray-700 mb-6">
                Click the button below to reset your password:
              </Text>
              <Section className="text-center">
                <Button
                  href={link}
                  className="bg-orange-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700"
                >
                  Reset Password
                </Button>
              </Section>
              <Text className="text-gray-500 text-sm mt-6">
                If you did not request a password reset, please ignore this email
                or contact support if you have questions.
              </Text>
            </Container>
          </Body>
        </Tailwind>
      </Html>
    );
  };
  
  export default ForgotPasswordEmail;