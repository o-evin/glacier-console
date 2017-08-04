import path from 'path';
import React from 'react';
import {Link, withRouter} from 'react-router-dom';

export default withRouter((props) => {

  const {prefix, vaultName} = props.match.params;

  if(!prefix) return null;

  const folders = prefix.split('/');

  return (
    <span>
      {folders.map((name, idx) => {
        const location = path.join('/vaults', vaultName,
          ...folders.slice(0, idx + 1), '/');

        return (
          <span key={idx}>
            <i className="fa fa-angle-right px-1" />
            {(idx === folders.length -1) ?
              <span className="text-muted small">{name}</span> :
              <Link to={location} className="text-muted small">{name}</Link>
            }
          </span>
        );
      })}
    </span>
  );
});
