// Netlify function: accepts a PDF, renders every page, then creates six equal crops per A4 page.
// Requires `npm install` during Netlify build. Persist returned base64 images in Supabase Storage in production.
const sharp = require('sharp');
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'POST a PDF' };
  try {
    const bytes = Buffer.from(event.body, event.isBase64Encoded ? 'base64' : 'binary');
    // libvips (bundled with Sharp) renders each PDF page at a high enough resolution for cards.
    const info=await sharp(bytes,{density:250,animated:true}).metadata(), cards=[];
    for(let p=0;p<(info.pages||1);p++){
      const raw=await sharp(bytes,{density:250,page:p}).png().toBuffer();
      const meta=await sharp(raw).metadata(), w=Math.floor(meta.width/3),h=Math.floor(meta.height/2);
      for(let y=0;y<2;y++)for(let x=0;x<3;x++) cards.push('data:image/webp;base64,'+(await sharp(raw).extract({left:x*w,top:y*h,width:w,height:h}).trim({background:'#ffffff',threshold:15}).webp({quality:86}).toBuffer()).toString('base64'));
    }
    return {statusCode:200,headers:{'Content-Type':'application/json'},body:JSON.stringify({cards})};
  } catch(e) { return {statusCode:422,body:JSON.stringify({error:'Could not process this PDF',detail:e.message})}; }
};
