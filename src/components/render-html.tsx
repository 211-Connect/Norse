import { HTML2React } from 'react-html-string-parser';
import { Anchor } from './anchor';

export default function RenderHtml({ html }: { html: string }) {
  return (
    <div className="prose whitespace-pre-wrap">
      <HTML2React
        html={html || ''}
        components={{
          a: ({ children, href, ...rest }) => (
            <Anchor href={href} {...rest}>
              {children}
            </Anchor>
          ),
        }}
      />
    </div>
  );
}
