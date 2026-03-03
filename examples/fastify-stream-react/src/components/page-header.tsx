import React from 'react';

type PageHeaderProps = {
  requestPath: string;
};

export function PageHeader(props: PageHeaderProps): React.ReactElement {
  return (
    <header>
      <p>{`Request Path: ${props.requestPath}`}</p>
    </header>
  );
}
