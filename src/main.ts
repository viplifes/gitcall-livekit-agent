import * as http from 'http';
import usercode from './usercode.js';

const port = process.env.GITCALL_PORT;
if (!port) {
    console.error('GITCALL_PORT env is required but not set');
    process.exit(1);
}

process.on('SIGTERM', () => process.exit(1));
process.on('SIGINT', () => process.exit(1));

const server = http.createServer((request: http.IncomingMessage, response: http.ServerResponse) => {
    if (request.method === 'POST' && request.url === '/') {
        let body: Uint8Array[] = [];
        request
            .on('data', (chunk: Uint8Array) => body.push(chunk))
            .on('end', () => {
                response.statusCode = 200;
                handler(Buffer.concat(body).toString(), response);
            });
    } else {
        response.statusCode = 404;
        response.end();
    }
});

interface JsonRpcRequest {
    jsonrpc: string;
    id: string | number;
    params: Record<string, any>;
}

const handler = (body: string, response: http.ServerResponse) => {
    try {
        const req: JsonRpcRequest = JSON.parse(body);
        const { jsonrpc, id, params } = req;

        if (typeof params !== 'object' || params === null) {
            throw new Error('expected request params to be an object');
        }

        const result = usercode(id, params);
        response.end(JSON.stringify({ jsonrpc, id, result }));
    } catch (e) {
        response.end(JSON.stringify({
            jsonrpc: '2.0',
            id: null,
            error: {
                code: 1,
                message: (e as Error).toString(),
            },
        }));
    }
};

console.log('Listening on 0.0.0.0:' + port);
server.listen(Number(port));
