import { useColorMode } from '@docusaurus/theme-common';
import Giscus from "@giscus/react";
import React from "react";

export default function GiscusComponent() {
    const { colorMode } = useColorMode();

    return (
        <Giscus
            repo="yoshino-s/blog"
            repoId="MDEwOlJlcG9zaXRvcnkzOTA1ODIzODA="
            category="General"
            categoryId="DIC_kwDOF0fQbM4CeCuE"  // E.g. id of "General"
            mapping="title"                        // Important! To map comments to URL
            term="Welcome to @giscus/react component!"
            strict="1"
            reactionsEnabled="1"
            emitMetadata="0"
            inputPosition="top"
            theme={colorMode}
            lang="en"
            loading="lazy"
        />
    );
}