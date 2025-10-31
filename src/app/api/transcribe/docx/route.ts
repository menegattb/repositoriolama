import { NextRequest, NextResponse } from 'next/server';
import { Document, Packer, Paragraph, TextRun } from 'docx';

/**
 * API Route para gerar documento DOCX da transcrição
 * Endpoint: POST /api/transcribe/docx
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcriptArray, videoTitle, lang } = body;

    // Validação de entrada
    if (!transcriptArray || !Array.isArray(transcriptArray)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Array de transcrição inválido. É necessário fornecer transcriptArray como array.' 
        },
        { status: 400 }
      );
    }

    if (transcriptArray.length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Array de transcrição está vazio.' 
        },
        { status: 400 }
      );
    }

    // Função auxiliar para formatar tempo para exibição (HH:MM:SS) - apenas horas, minutos e segundos inteiros
    const formatTimeForDisplay = (milliseconds: number): string => {
      const totalSeconds = Math.floor(milliseconds / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
      
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    // Criar parágrafos do documento
    const paragraphs: Paragraph[] = [];

    // Cabeçalho: Título do vídeo
    if (videoTitle) {
      paragraphs.push(
        new Paragraph({
          text: videoTitle,
          heading: 'Heading1',
          spacing: { after: 400 },
        })
      );
    }

    // Metadados: Idioma
    if (lang) {
      paragraphs.push(
        new Paragraph({
          text: `Idioma: ${lang.toUpperCase()}`,
          spacing: { after: 200 },
        })
      );
    }

    // Linha em branco
    paragraphs.push(new Paragraph({ text: '' }));

    // Adicionar cada item da transcrição
    transcriptArray.forEach((item) => {
      const text = item.text || item.content || '';
      
      if (text && text.trim().length > 0) {
        const timeStr = formatTimeForDisplay(item.offset || 0);
        
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `[${timeStr}] `,
                bold: true,
                color: '666666', // Cinza médio
              }),
              new TextRun({
                text: text.trim(),
              }),
            ],
            spacing: { after: 120 },
          })
        );
      }
    });

    // Criar documento
    const doc = new Document({
      sections: [{
        children: paragraphs,
      }],
    });

    // Gerar buffer do documento
    const buffer = await Packer.toBuffer(doc);

    // Criar nome do arquivo seguro
    const safeTitle = (videoTitle || 'transcricao')
      .replace(/[^a-z0-9\s-]/gi, '')
      .replace(/\s+/g, '-')
      .substring(0, 50);
    
    const filename = `transcricao-${safeTitle}-${Date.now()}.docx`;

    // Converter Buffer para Uint8Array para NextResponse
    const uint8Array = new Uint8Array(buffer);

    // Retornar como blob
    return new NextResponse(uint8Array, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('Erro ao gerar DOCX:', errorMessage);
    if (errorStack) {
      console.error('Stack trace:', errorStack);
    }
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Erro interno do servidor ao gerar documento DOCX',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

// Handler para métodos não permitidos
export async function GET() {
  return NextResponse.json(
    { error: 'Método não permitido. Use POST.' },
    { status: 405 }
  );
}

