import { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';

interface Token {
review: boolean;
}

const tokens = JSON.parse(process.env.TOKENS);

function getReview() {
const response = fetch('https://example.com/review', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify(tokens),
});
return response.json();
}

export default async function handler(req: NextApiRequest, res: NextApiResp[11D[K
NextApiResponse) {
if (req.method === 'POST') {
const { review } = req.body;

    try {
      const data = await getReview();
      console.log(data);

      // Aquí puedes hacer lo que sea necesario con el resultado
      return res.status(200).json({ message: '¡Listo!' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Error al realizar la revisión[8D[K

revisión' });
}
}

return res.status(405).json({ message: 'Metodo no soportado' });
}

export const config = {
api: {
bodyParser: false,
},
};
