export async function downloadOracleCardPng({ mode, item, portraitDataUrl, playerName }) {
  const W = 940;
  const H = 1320;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Outer card background
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#FFFDF7');
  bg.addColorStop(1, '#FEF7E0');
  ctx.fillStyle = bg;
  roundRect(ctx, 16, 16, W - 32, H - 32, 48);
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#34D399';
  ctx.stroke();

  // Header gradient banner
  const headGrad = ctx.createLinearGradient(0, 16, W, 195);
  headGrad.addColorStop(0, '#1B172C');
  headGrad.addColorStop(0.55, '#3B0764');
  headGrad.addColorStop(1, '#064E3B');
  ctx.save();
  roundRect(ctx, 21, 21, W - 42, 175, 42);
  ctx.clip();
  ctx.fillStyle = headGrad;
  ctx.fillRect(21, 21, W - 42, 175);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#6EE7B7';
  ctx.font = '800 23px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText(`✨ ${item.code} ✨`, W / 2, 84);

  ctx.fillStyle = '#FFFDF7';
  ctx.font = '900 38px "Be Vietnam Pro", system-ui, sans-serif';
  const modeTitle = mode === 'place' ? '🧭 Quẻ Hôm Nay Đi Đâu' : '🍜 Quẻ Hôm Nay Ăn Gì';
  ctx.fillText(modeTitle, W / 2, 146);

  // 3D Statue Portrait frame
  const pX = 70;
  const pY = 222;
  const pW = W - 140;
  const pH = 360;
  await drawPortraitFrame(ctx, portraitDataUrl, pX, pY, pW, pH);

  // Pick Title
  ctx.fillStyle = '#432818';
  ctx.font = '900 32px "Be Vietnam Pro", system-ui, sans-serif';
  let curY = wrapText(ctx, item.title, W / 2, 642, W - 150, 42);

  // Price + Vibe Pill
  curY += 18;
  ctx.fillStyle = '#DCFCE7';
  roundRect(ctx, 90, curY, W - 180, 56, 28);
  ctx.fill();
  ctx.fillStyle = '#065F46';
  ctx.font = '800 21px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText(`${item.priceNote}  •  ${item.vibeNote}`, W / 2, curY + 36, W - 220);

  // Dobby Dark Roast Box
  curY += 84;
  ctx.fillStyle = '#241834';
  roundRect(ctx, 70, curY, W - 140, 210, 28);
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#A78BFA';
  ctx.stroke();

  ctx.fillStyle = '#FDE68A';
  ctx.font = '900 22px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText('🔮 LỜI PHÁN GAY GẮT CỦA DOBBY', W / 2, curY + 42);

  ctx.fillStyle = '#FAF5FF';
  ctx.font = '700 23px "Be Vietnam Pro", system-ui, sans-serif';
  wrapText(ctx, item.roast, W / 2, curY + 86, W - 200, 34);

  // Poem + Tip
  curY += 238;
  ctx.fillStyle = '#FEF9C3';
  roundRect(ctx, 90, curY, W - 180, 124, 24);
  ctx.fill();
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#F59E0B';
  ctx.stroke();

  ctx.fillStyle = '#78350F';
  ctx.font = '700 24px "Be Vietnam Pro", system-ui, sans-serif';
  item.poem.split('\n').forEach((ln, idx) => {
    ctx.fillText(`“${ln.replace(/^[“"]|[”"]$/g, '')}”`, W / 2, curY + 48 + idx * 38);
  });

  ctx.fillStyle = '#7C583A';
  ctx.font = '700 20px "Be Vietnam Pro", system-ui, sans-serif';
  ctx.fillText(`Đền Dobby Tự Do • Phù thuỷ xin quẻ: ${playerName}`, W / 2, H - 54);

  triggerDownload(canvas, `xin-que-${mode}-${Date.now()}.png`);
}

async function drawPortraitFrame(ctx, portraitDataUrl, pX, pY, pW, pH) {
  ctx.save();
  roundRect(ctx, pX, pY, pW, pH, 28);
  ctx.clip();
  const pGrad = ctx.createLinearGradient(0, pY, 0, pY + pH);
  pGrad.addColorStop(0, '#181622');
  pGrad.addColorStop(1, '#1F2937');
  ctx.fillStyle = pGrad;
  ctx.fillRect(pX, pY, pW, pH);

  if (portraitDataUrl) {
    const img = await loadImage(portraitDataUrl);
    if (img) {
      const scale = Math.max(pW / img.width, pH / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      ctx.drawImage(img, pX + (pW - dw) / 2, pY + (pH - dh) / 2, dw, dh);
    }
  }
  ctx.restore();

  ctx.lineWidth = 3.5;
  ctx.strokeStyle = '#34D399';
  roundRect(ctx, pX, pY, pW, pH, 28);
  ctx.stroke();
}

function triggerDownload(canvas, filename) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.closePath();
}

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(' ');
  let line = '';
  let curY = y;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, curY);
      line = w;
      curY += lineH;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, curY);
  return curY;
}
