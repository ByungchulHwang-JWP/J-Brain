import { Navigate, useLocation } from 'react-router-dom';

const DeprecatedRouteRedirect = ({ to }) => {
  const location = useLocation();
  const [targetPath, targetSearch = ''] = to.split('?');
  const mergedSearchParams = new URLSearchParams(location.search);
  const targetSearchParams = new URLSearchParams(targetSearch);

  targetSearchParams.forEach((value, key) => {
    mergedSearchParams.set(key, value);
  });

  const mergedSearch = mergedSearchParams.toString();
  const target = mergedSearch ? `${targetPath}?${mergedSearch}` : targetPath;

  return <Navigate to={target} replace state={{ deprecatedFrom: location.pathname }} />;
};

export default DeprecatedRouteRedirect;
