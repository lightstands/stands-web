import Box from "@suid/material/Box";
import TextField from "@suid/material/TextField";
import Toolbar from "@suid/material/Toolbar";
import { Component, createEffect, createSignal } from "solid-js";
import BottomSheet from "../common/BottomSheet";
import ToolbarIcon from "../common/ToolbarIcon";
import ToolbarTitle from "../common/ToolbarTitle";
import { Close as CloseIcon, Check as CheckIcon } from "@suid/icons-material";
import { PASS_REGEX } from "../common/regex";
import Typography from "@suid/material/Typography";
import { aeither, setUserPassword } from "lightstands-js";
import { useClient } from "../client";
import { useStore } from "@nanostores/solid";
import { currentSessionStore } from "../stores/session";

interface SetPasswordDlgProps {
    open: boolean;
    onClose?: (
        ev: {},
        reason: "escapeKeyDown" | "backdropClick" | "closeClick" | "passwordSet"
    ) => void;
}

const SetPasswordDlg: Component<SetPasswordDlgProps> = (props) => {
    const [newPass, setNewPass] = createSignal("");
    const [newPassError, setNewPassError] = createSignal<string>();
    const client = useClient();
    const session = useStore(currentSessionStore);

    createEffect(() => {
        const password = newPass();
        if (!PASS_REGEX.test(password)) {
            setNewPassError("The password have invalid character");
        } else {
            setNewPassError();
        }
    });

    const onSetPassword = () => {
        aeither(
            {
                left(l) {
                    setNewPassError(
                        "Your session must be expired. Sign out or sign in again may fix that."
                    );
                },
                right() {
                    props.onClose
                        ? props.onClose({}, "passwordSet")
                        : undefined;
                },
            },
            setUserPassword(
                client,
                session()!.session,
                session()!.session.accessTokenObject.userid,
                newPass()
            )
        );
    };
    return (
        <>
            <BottomSheet open={props.open} onClose={props.onClose}>
                <Toolbar>
                    <ToolbarIcon
                        onClick={() =>
                            props.onClose
                                ? props.onClose({}, "closeClick")
                                : undefined
                        }
                    >
                        <CloseIcon />
                    </ToolbarIcon>
                    <ToolbarTitle primary="Set New Password" />
                    <ToolbarIcon
                        disabled={!!(!newPass() || newPassError())}
                        onClick={onSetPassword}
                    >
                        <CheckIcon />
                    </ToolbarIcon>
                </Toolbar>
                <Box sx={{ marginX: "24px", marginBottom: "24px" }}>
                    <TextField
                        label="New Password"
                        fullWidth
                        variant="standard"
                        autoFocus
                        autoComplete="new-password"
                        value={newPass()}
                        onChange={(e) => setNewPass(e.target.value)}
                        error={!!newPassError()}
                        helperText={newPassError() || " "}
                        type="password"
                        id="new-password"
                    />
                    <Typography sx={{ marginTop: "12px" }}>
                        Password must be at least 8 characters, up to 64
                        characters. We accept English alphas(a to z and A to Z),
                        numbers (0 to 9) and symbols
                        (-_$%&@^`~.,;:\/|\&lt;&gt;*+!?=[]&lbrace;&rbrace;()).
                        Password is case-sensitive: "helloworld" is different
                        from "HelloWorld".
                    </Typography>
                    <Typography>
                        The change of the password won't affect existing
                        sessions.
                    </Typography>
                </Box>
            </BottomSheet>
        </>
    );
};

export default SetPasswordDlg;
