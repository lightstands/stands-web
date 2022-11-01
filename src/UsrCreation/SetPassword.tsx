import { useNavigate, useSearchParams } from "@solidjs/router";
import Box from "@suid/material/Box";
import Button from "@suid/material/Button";
import CardContent from "@suid/material/CardContent";
import CardHeader from "@suid/material/CardHeader";
import TextField from "@suid/material/TextField";
import Typography from "@suid/material/Typography";
import { Component, createEffect, createSignal } from "solid-js";
import CenterCard from "../common/CenterCard";
import { aeither, setUserPassword } from "lightstands-js";
import { useClient } from "../client";
import { PASS_REGEX } from "../common/regex";
import { revokeSession } from "lightstands-js";

/* Accept session (the access token) from search string.

For exmaple:
?session=xxxxx
*/

const SetPasswordPage: Component = () => {
    const navigate = useNavigate();
    const client = useClient();
    const [searchParams] = useSearchParams<{
        session: string;
        userid: string;
        username: string;
    }>();
    const [password, setPassword] = createSignal("");
    const [passwordGuidance, setPasswordGuidance] = createSignal<string>();

    const makeGuidance = (pass: string) => {
        if (pass.length < 8) {
            return "Password must be at least 8 characters";
        } else if (pass.length > 64) {
            return "Password is up to 64 characters";
        } else if (!PASS_REGEX.test(pass)) {
            return "Password have invalid character";
        }
        return null;
    };

    createEffect(() => {
        const pass = password();
        setPasswordGuidance(makeGuidance(pass) || undefined);
    });

    const setPasswordAndCompleteReg = async () => {
        const userId = Number.parseInt(searchParams.userid);
        await aeither(
            {
                left(l) {
                    throw l;
                },
                right() {
                    revokeSession(client, {
                        accessToken: searchParams.session,
                    }).then(() => {
                        navigate(
                            `/sign-in/?username=${encodeURIComponent(
                                searchParams.username
                            )}`
                        );
                    });
                },
            },
            setUserPassword(
                client,
                { accessToken: searchParams.session },
                userId,
                password()
            )
        );
    };

    return (
        <>
            <CenterCard>
                <CardHeader title="Set your password" />
                <CardContent>
                    <TextField
                        label="Password"
                        autoComplete="new-password"
                        fullWidth
                        variant="standard"
                        autoFocus
                        type="password"
                        value={password()}
                        onChange={(e) => setPassword(e.target.value)}
                        helperText={passwordGuidance() || " "}
                    />
                    <Typography sx={{ marginTop: "12px" }}>
                        Password must be at least 8 characters, up to 64
                        characters. We accept English alphas(a to z and A to Z),
                        numbers (0 to 9) and symbols
                        (-_$%&@^`~.,;:\/|\&lt;&gt;*+!?=[]&lbrace;&rbrace;()).
                        Password is case-sensitive: "helloworld" is different
                        from "HelloWorld".
                    </Typography>
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
                            disabled={!!passwordGuidance()}
                            onClick={setPasswordAndCompleteReg}
                        >
                            Done
                        </Button>
                    </Box>
                </CardContent>
            </CenterCard>
        </>
    );
};

export default SetPasswordPage;
