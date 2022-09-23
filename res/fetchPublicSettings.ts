// Copyright 2022 Rubicon.
// SPDX-License-Identifier: 	AGPL-3.0-or-later

import { createResource } from "solid-js";
import {
    PublicSettings,
    getPublicSettings,
    aunwrap,
    ClientConfig,
} from "lightstands-js";

export default (client: ClientConfig) =>
    createResource<PublicSettings, void>(
        () => {
            return aunwrap(getPublicSettings(client));
        },
        {
            name: "lightstands-public-settings",
        }
    );
