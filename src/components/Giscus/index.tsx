import React from 'react';
import Giscus from "@giscus/react";
import { useColorMode } from '@docusaurus/theme-common';

export default function GiscusComponent() {
    const { colorMode } = useColorMode();

    return (
        <Giscus
            repo="yoshino-s/blog.yoshino-s.online"
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