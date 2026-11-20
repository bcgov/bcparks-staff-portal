// AdminJS login page with IDIR (Keycloak) login instead of the password form.
// Copied from AdminJS's stock Login component
// (node_modules/adminjs/lib/frontend/components/login/index.js)
// so it keeps the standard look; only the form is replaced with a button.

import {
  Box,
  Button,
  H2,
  H5,
  Illustration,
  MadeWithLove,
  MessageBox,
  Text,
} from "@adminjs/design-system";
import { styled } from "@adminjs/design-system/styled-components";
import { useTranslation } from "adminjs";
import { useSelector } from "react-redux";

const Wrapper = styled(Box)`
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 100%;
`;

const StyledLogo = styled.img`
  max-width: 200px;
  margin: ${({ theme }) => theme.space.md} 0;
`;

const IllustrationsWrapper = styled(Box)`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  & svg [stroke="#3B3552"] {
    stroke: rgba(255, 255, 255, 0.5);
  }
  & svg [fill="#3040D6"] {
    fill: rgba(255, 255, 255, 1);
  }
`;

/**
 * AdminJS login page. Users log in with IDIR through the Keycloak routes in
 * middleware/adminKeycloak.js; error codes are translated in adminJs.js.
 * @returns {JSX.Element} Login page
 */
function AdminLogin() {
  // eslint-disable-next-line no-underscore-dangle -- AdminJS passes login page props as __APP_STATE__
  const { action = "", errorMessage: message } = window.__APP_STATE__ ?? {};
  const { translateComponent, translateMessage } = useTranslation();
  const branding = useSelector((state) => state.branding);

  // The Keycloak routes live next to the AdminJS login route
  const keycloakLoginPath = action.replace(/\/login$/u, "/keycloak/login");

  return (
    <Wrapper flex variant="grey" className="login__Wrapper">
      <Box
        bg="white"
        height="440px"
        flex
        boxShadow="login"
        width={[1, 2 / 3, "auto"]}
      >
        <Box
          bg="primary100"
          color="white"
          p="x3"
          width="380px"
          flexGrow={0}
          display={["none", "none", "block"]}
          position="relative"
        >
          <H2 fontWeight="lighter">
            {translateComponent("Login.welcomeHeader")}
          </H2>
          <Text fontWeight="lighter" mt="default">
            {translateComponent("Login.welcomeMessage")}
          </Text>
          <IllustrationsWrapper p="xxl">
            <Box display="inline" mr="default">
              <Illustration variant="Planet" width={82} height={91} />
            </Box>
            <Box display="inline">
              <Illustration variant="Astronaut" width={82} height={91} />
            </Box>
            <Box display="inline" position="relative" top="-20px">
              <Illustration variant="FlagInCog" width={82} height={91} />
            </Box>
          </IllustrationsWrapper>
        </Box>

        <Box p="x3" flexGrow={1} width={["100%", "100%", "480px"]}>
          <H5 marginBottom="xxl">
            {branding.logo ? (
              <StyledLogo src={branding.logo} alt={branding.companyName} />
            ) : (
              branding.companyName
            )}
          </H5>

          <Text mt="xl">
            <Button
              as="a"
              href={keycloakLoginPath}
              variant="contained"
              size="lg"
              fontSize="lg"
              py="lg"
              px="x4"
              width="100%"
            >
              Log in with IDIR &mdash; MFA
            </Button>
          </Text>

          {message && (
            <MessageBox
              mt="xxl"
              mb="lg"
              message={
                message.split(" ").length > 1
                  ? message
                  : translateMessage(message)
              }
              variant="danger"
            />
          )}
        </Box>
      </Box>

      {branding.withMadeWithLove ? (
        <Box mt="xxl">
          <MadeWithLove />
        </Box>
      ) : null}
    </Wrapper>
  );
}

export default AdminLogin;
