import React, { useEffect, useMemo } from 'react';
import originalHtml from '../th-veiculos-landing-page.html?raw';

const ORIGINAL_HEAD_ATTRIBUTE = 'data-original-veiculos-head';
const ORIGINAL_SCRIPT_ATTRIBUTE = 'data-original-veiculos-script';

function parseOriginalPage() {
  return new DOMParser().parseFromString(originalHtml, 'text/html');
}

function runAfterDomReady(scriptContent) {
  const domReadyStart = "document.addEventListener('DOMContentLoaded', () => {";
  const trimmedContent = scriptContent.trim();

  if (!trimmedContent.startsWith(domReadyStart) || !trimmedContent.endsWith('});')) {
    return scriptContent;
  }

  return trimmedContent.slice(domReadyStart.length, -3);
}

function appendScript(script) {
  return new Promise((resolve, reject) => {
    const clonedScript = document.createElement('script');
    clonedScript.setAttribute(ORIGINAL_SCRIPT_ATTRIBUTE, 'true');

    Array.from(script.attributes).forEach((attribute) => {
      clonedScript.setAttribute(attribute.name, attribute.value);
    });

    if (script.src) {
      clonedScript.onload = resolve;
      clonedScript.onerror = reject;
      clonedScript.src = script.src;
    } else {
      clonedScript.textContent = runAfterDomReady(script.textContent);
      resolve();
    }

    document.body.appendChild(clonedScript);
  });
}

function App() {
  const pageHtml = useMemo(() => {
    const documentHtml = parseOriginalPage();

    documentHtml.body.querySelectorAll('script').forEach((script) => script.remove());

    return documentHtml.body.innerHTML;
  }, []);

  useEffect(() => {
    const documentHtml = parseOriginalPage();
    const injectedHeadNodes = [];

    documentHtml.head.querySelectorAll('link, style').forEach((node) => {
      const clonedNode = node.cloneNode(true);
      clonedNode.setAttribute(ORIGINAL_HEAD_ATTRIBUTE, 'true');
      document.head.appendChild(clonedNode);
      injectedHeadNodes.push(clonedNode);
    });

    const originalScripts = Array.from(documentHtml.body.querySelectorAll('script'));
    const injectedScripts = [];

    originalScripts
      .reduce((chain, script) => chain.then(() => appendScript(script)), Promise.resolve())
      .then(() => {
        document
          .querySelectorAll(`[${ORIGINAL_SCRIPT_ATTRIBUTE}="true"]`)
          .forEach((script) => injectedScripts.push(script));
      });

    return () => {
      injectedHeadNodes.forEach((node) => node.remove());
      injectedScripts.forEach((script) => script.remove());
      document.body.classList.remove('menu-open');
    };
  }, []);

  return <main dangerouslySetInnerHTML={{ __html: pageHtml }} />;
}

export default App;
