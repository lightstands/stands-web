import { useNavigate, useParams } from "@solidjs/router";
import Box from "@suid/material/Box";
import Button from "@suid/material/Button";
import CardContent from "@suid/material/CardContent";
import CardHeader from "@suid/material/CardHeader";
import IconButton from "@suid/material/IconButton";
import TextField from "@suid/material/TextField";
import Typography from "@suid/material/Typography";
import {
    aeither,
    checkCreationChallenge,
    isLeft,
    unboxRight,
    resolveCreationRequest,
    ExistsError,
} from "lightstands-js";
import { Component, createEffect, createSignal } from "solid-js";
import EmailSync from "../assets/EmailSync";
import { useClient } from "../client";
import CenterCard from "../common/CenterCard";

const USR_NAME_REGEX = /^[a-zA-Z0-9\-_]+$/;

const EmailFlowStage1: Component = () => {
    const params = useParams<{ email: string }>();
    const client = useClient();
    const navigate = useNavigate();
    const email = () => decodeURIComponent(params.email);
    const [vCode, setVCode] = createSignal("");
    const [username, setUsername] = createSignal("");
    const [usernameError, setUsernameError] = createSignal<string>();
    const [challengeSuccess, setChallengeSuccess] = createSignal<boolean>();
    const [usernameGuidance, setUsernameGuidance] = createSignal<string>();

    createEffect(() => {
        const code = vCode();
        setChallengeSuccess(undefined);
        if (code.length >= 6) {
            aeither(
                {
                    left(l) {
                        setChallengeSuccess(false);
                    },
                    right(r) {
                        setChallengeSuccess(r);
                    },
                },
                checkCreationChallenge(client, { email: email() }, code)
            );
        }
    });

    const makeGuidance = (username: string) => {
        if (username.length < 6) {
            return "The username must be at least 6 characters";
        } else if (!USR_NAME_REGEX.test(username)) {
            return "The username have unavaliable character";
        }
        return null;
    };

    createEffect(() => {
        const name = username();
        setUsernameError();
        setUsernameGuidance(makeGuidance(name) || undefined);
    });

    const canContinue = () =>
        !usernameError() && !usernameGuidance() && challengeSuccess();

    const resolveCreation = () => {
        aeither(
            {
                left(l) {
                    if (l instanceof ExistsError && l.matchKeys(["username"])) {
                        setUsernameError(
                            "The username have been used, please try another"
                        );
                    } else {
                        throw l;
                    }
                },
                right(r) {
                    if (r.resolved) {
                        navigate(
                            `/sign-up/set-password?session=${encodeURIComponent(
                                r.resolved!.accessToken.token
                            )}&userid=${r.resolved.user.userid.toString(
                                16
                            )}&username=${encodeURIComponent(
                                r.resolved.user.username
                            )}`
                        );
                    } else {
                        throw Error(
                            "bad state: bad assumption of the creation resolving result"
                        );
                    }
                },
            },
            resolveCreationRequest(client, { email: email() }, vCode(), {
                username: username(),
            })
        );
    };

    return (
        <>
            <CenterCard>
                <CardHeader
                    title="Type your verification code and username"
                    subheader={`The code have been sent to ${email()}.`}
                />
                <CardContent>
                    <Box sx={{ display: "flex", flexDirection: "row" }}>
                        <TextField
                            label="The verification code"
                            fullWidth
                            variant="standard"
                            autoComplete="one-time-code"
                            value={vCode()}
                            onChange={(e) =>
                                setVCode(e.target.value.toLowerCase())
                            }
                            color={challengeSuccess() ? "success" : undefined}
                            error={
                                typeof challengeSuccess() !== "undefined" &&
                                !challengeSuccess()
                            }
                        />
                        <div style={{ "margin-top": "8px", "flex-grow": 1 }}>
                            <IconButton
                                sx={{
                                    height: "fit-content",
                                }}
                            >
                                <EmailSync />
                            </IconButton>
                        </div>
                    </Box>

                    <Box sx={{ marginTop: "16px" }}>
                        <TextField
                            label="New username"
                            fullWidth
                            variant="standard"
                            autoComplete="username"
                            value={username()}
                            onChange={(e) => setUsername(e.target.value)}
                            error={!!usernameError()}
                            helperText={
                                usernameError() || usernameGuidance() || " "
                            }
                        />
                        <div
                            style={{
                                "margin-top": "4px",
                                "margin-bottom": "16px",
                            }}
                        >
                            <Typography>
                                We only accept english alpha characters (a to z
                                and A to Z), numbers (0 to 9), dash (-) and
                                underscore (_) in the username. Usernames are
                                case-sensitive: "hello" is different from
                                "Hello".
                            </Typography>
                        </div>
                        <Typography>
                            The username will be appeared on your public profile
                            while the email address is hidden from public.
                        </Typography>
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
                            disabled={!canContinue()}
                            onClick={resolveCreation}
                        >
                            Continue
                        </Button>
                    </Box>
                </CardContent>
            </CenterCard>
        </>
    );
};

export default EmailFlowStage1;
