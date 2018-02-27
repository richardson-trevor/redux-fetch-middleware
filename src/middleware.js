import {seconds} from 'milliseconds';
import {use} from '@travi/ioc';
import delay from './delay-wrapper';

function repeatFetch(dispatch, action) {
  return delay(seconds(3)).then(() => dispatch(action));
}

export default (session = {}) => ({dispatch}) => next => action => {
  const fetcher = use('fetcher-factory').createFetcher(session);
  const {fetch, initiate, success, failure, data, retry} = action;

  if (!fetch) {
    return next(action);
  }

  dispatch({type: initiate, ...data});

  return fetch(fetcher)
    .then(response => {
      if (retry && retry(null, response)) return repeatFetch(dispatch, action);

      return dispatch({type: success, resource: response, ...data});
    })
    .catch(err => {
      if (retry && retry(err)) return repeatFetch(dispatch, action);

      return dispatch({type: failure, error: err, ...data});
    });
};
