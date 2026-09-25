Some of these components were originally copied from https://github.com/bcgov/react-shared-components
(previously kept together in a `shared/` folder): `CategorySelect`, `CountBadge`, `FilterStatus`,
`LightTooltip`, `MultiSelect`, `ReviewIcon`, `SingleSelect`, `SummaryActionButton` and
`TableActionButton`. `Button` and `Loader` came from the same source and now live in
`src/components/` because they are shared across portal apps.

There was previously a reference to this project in package.json, but it was removed because
it was causing issues with upgrading to Node.js 18 due to a dependency on Python 2 via
react-scripts and node-sass.
