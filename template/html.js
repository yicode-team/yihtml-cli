module.exports = `
<!DOCTYPE html>
<html>
    <head>
        <include src="./tpls/head.html" />
        <title><%= kebabCaseName %></title>
        <link rel="stylesheet" type="text/css" href="./css/<%= camelCaseName %>.css" />
    </head>
    <body>
        <div id="app" class="page-<%= kebabCaseName %>"></div>
        <include src="./tpls/script.html" />
        <script src="./js/<%= camelCaseName %>.js"></script>
    </body>
</html>
`;
