import { useNavigate } from "@solidjs/router";
import Box from "@suid/material/Box";
import Button from "@suid/material/Button";
import CardContent from "@suid/material/CardContent";
import CardHeader from "@suid/material/CardHeader";
import TextField from "@suid/material/TextField";
import {
    Component,
    createEffect,
    createResource,
    createSignal,
    Show,
} from "solid-js";
import CenterCard from "../common/CenterCard";
import {
    aunwrap,
    getPublicSettings,
    newCreationRequest,
    requestCreationVerification,
} from "lightstands-js";
import { useClient } from "../client";
import { default as HCaptcha } from "solid-hcaptcha";

/* User Creation Email Flow
Stage 0 - Enter email
Stage 1 - Enter username and challenge
Stage 2 - Change password
*/

const EmailFlowStage0: Component = () => {
    const navigate = useNavigate();
    const client = useClient();
    const [email, setEmail] = createSignal("");
    const [emailError, setEmailError] = createSignal<boolean>(false);
    const [emailHelperText, setEmailHelperText] = createSignal<string>();
    const [hCaptchaResponse, setHCaptchaResponse] = createSignal<string>();

    const [apiPublicSettings] = createResource(
        () => client,
        (client) => {
            return aunwrap(getPublicSettings(client));
        }
    );

    /** Check email address and set corresponding error message.
     *
     * @returns true if error, false otherwise
     */
    const checkEmailError = () => {
        const addr = email();
        if (!addr.includes("@")) {
            setEmailHelperText("Please enter an email address");
            return true;
        } else if (addr.indexOf("@", addr.length - 1) === addr.length - 1) {
            setEmailHelperText("Please enter the domain of your email address");
            return true;
        } else {
            setEmailHelperText();
        }
        return false;
    };

    const startRegistration = async () => {
        if (checkEmailError()) {
            setEmailError(true);
            return;
        }
        if (!hCaptchaResponse()) {
            return;
        }
        const request = await aunwrap(
            newCreationRequest(
                client,
                { email: email() },
                { hCaptcha: hCaptchaResponse()! }
            )
        );
        await requestCreationVerification(client, { email: email() }); // best effort
        navigate(`/sign-up/email/${encodeURIComponent(email())}/`);
    };

    createEffect(() => {
        checkEmailError();
        setEmailError(false);
    });
    return (
        <>
            <CenterCard>
                <CardHeader title="Start your journey with LightStands" />
                <CardContent>
                    <TextField
                        label="Your Email Address"
                        fullWidth
                        variant="standard"
                        autoFocus
                        autoComplete="email"
                        value={email()}
                        onChange={(ev) => setEmail(ev.target.value)}
                        error={emailError()}
                        helperText={emailHelperText() || " "}
                    />
                    <Box sx={{ minHeight: "84px", marginTop: "12px" }}>
                        <Show when={apiPublicSettings()?.hcaptchaSiteKey}>
                            <HCaptcha
                                sitekey={apiPublicSettings()!.hcaptchaSiteKey!}
                                onVerify={(token) => setHCaptchaResponse(token)}
                            />
                        </Show>
                    </Box>

                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "end",
                            marginTop: "16px",
                        }}
                    >
                        <Button
                            variant="contained"
                            disableElevation
                            disabled={
                                !email() && !emailError() && !hCaptchaResponse()
                            }
                            onClick={startRegistration}
                        >
                            Continue
                        </Button>
                    </Box>
                </CardContent>
            </CenterCard>
        </>
    );
};

export default EmailFlowStage0;
