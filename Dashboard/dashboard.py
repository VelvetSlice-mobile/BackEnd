import os
import sys
import requests
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from matplotlib.patches import FancyBboxPatch
from matplotlib.backends.backend_pdf import PdfPages
from datetime import datetime

# ── Configuração ─────────────────────────────────────────────────────────────
API_URL   = os.environ.get('API_URL',   'http://127.0.0.1:3000')
ADM_EMAIL = os.environ.get('ADM_EMAIL', 'admin@velvet.com')
ADM_SENHA = os.environ.get('ADM_SENHA', 'admin123')

# ── Cores ─────────────────────────────────────────────────────────────────────
PRIMARY   = '#3B1F0E'
SECONDARY = '#C07A50'
ACCENT    = '#E8A87C'
BG        = '#FDFAF7'
WHITE     = '#FFFFFF'
SUCCESS   = '#4CAF50'
WARNING   = '#FF9800'
DANGER    = '#E53935'
GRAY      = '#9E9E9E'
PALETTE   = [SECONDARY, PRIMARY, ACCENT, '#8B4513', '#D2691E', '#A0522D', '#CD853F', '#DEB887']

plt.rcParams.update({
    'font.family':        'DejaVu Sans',
    'axes.spines.top':    False,
    'axes.spines.right':  False,
    'axes.grid':          True,
    'grid.alpha':         0.3,
    'grid.color':         '#E0D0C0',
    'axes.facecolor':     BG,
    'figure.facecolor':   BG,
})


# ── Autenticação ──────────────────────────────────────────────────────────────
def login():
    try:
        r = requests.post(
            f'{API_URL}/api/clients/login',
            json={'email': ADM_EMAIL, 'senha': ADM_SENHA},
            timeout=10,
        )
        r.raise_for_status()
        token = r.json().get('access_token')
        if not token:
            print('Erro: login retornou sem token. Verifique ADM_EMAIL e ADM_SENHA.')
            sys.exit(1)
        return token
    except requests.exceptions.ConnectionError:
        print(f'Erro: não foi possível conectar à API em {API_URL}')
        print('Certifique-se de que o BackEnd está rodando (npm run dev) e tente novamente.')
        sys.exit(1)
    except requests.exceptions.HTTPError as e:
        print(f'Erro de autenticação: {e}')
        sys.exit(1)


def get(path, token=None):
    headers = {'Authorization': f'Bearer {token}'} if token else {}
    r = requests.get(f'{API_URL}{path}', headers=headers, timeout=10)
    r.raise_for_status()
    return r.json()


# ── Carregamento de dados via JSON ────────────────────────────────────────────
def load_data():
    print('Autenticando na API...')
    token = login()
    print('Carregando dados...')

    stats       = get('/api/dashboard/stats',         token)   # {produtos, vendas, pedidos}
    mais_vend   = get('/api/dashboard/mais-vendidos', token)   # [{id_bolo, nome, preco, total_vendido}]
    pedidos_raw = get('/api/dashboard/pedidos',       token)   # [{id_pedido, valor_total, status_pedido, metodo_pagamento, ...}]
    bolos_raw   = get('/api/bolos')                            # público — inclui categoria

    pedidos       = pd.DataFrame(pedidos_raw)   if pedidos_raw   else pd.DataFrame()
    mais_vendidos = pd.DataFrame(mais_vend)     if mais_vend     else pd.DataFrame()
    bolos         = pd.DataFrame(bolos_raw)     if bolos_raw     else pd.DataFrame()

    # Enriquecer mais_vendidos com categoria (join com /api/bolos)
    if not mais_vendidos.empty and not bolos.empty and 'categoria' in bolos.columns:
        mais_vendidos = mais_vendidos.merge(
            bolos[['id_bolo', 'categoria']], on='id_bolo', how='left'
        )
        mais_vendidos['receita'] = mais_vendidos['preco'] * mais_vendidos['total_vendido']

    print('Dados carregados com sucesso.')
    return stats, mais_vendidos, pedidos


# ── Formatação monetária ──────────────────────────────────────────────────────
def fmt_brl(value):
    return f'R$ {value:,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')


# ── Geração do dashboard ──────────────────────────────────────────────────────
def build_dashboard(export_pdf=False):
    stats, mais_vendidos, pedidos = load_data()

    total_pedidos  = stats.get('pedidos', 0)
    faturamento    = stats.get('vendas', 0)
    ticket_medio   = faturamento / total_pedidos if total_pedidos else 0
    total_produtos = stats.get('produtos', 0)
    total_desconto = pedidos['desconto_valor'].sum() if (not pedidos.empty and 'desconto_valor' in pedidos.columns) else 0

    status_counts = pedidos['status_pedido'].fillna('Pendente').value_counts() if not pedidos.empty else pd.Series(dtype=int)
    pagamentos    = pedidos['metodo_pagamento'].fillna('Não informado').value_counts() if not pedidos.empty else pd.Series(dtype=int)

    categorias = pd.Series(dtype=float)
    if not mais_vendidos.empty and 'categoria' in mais_vendidos.columns and 'receita' in mais_vendidos.columns:
        categorias = (
            mais_vendidos.groupby('categoria')['receita']
            .sum()
            .sort_values(ascending=False)
        )
        categorias = categorias[categorias.index.notna() & (categorias.index != '')]

    # ── Figura ────────────────────────────────────────────────────────────────
    fig = plt.figure(figsize=(18, 12), facecolor=BG)

    fig.text(0.5, 0.992, 'Velvet Slice', ha='center', va='top',
             fontsize=26, fontweight='bold', color=PRIMARY)
    fig.text(0.5, 0.952, 'Dashboard de Vendas e Performance',
             ha='center', va='top', fontsize=13, color=SECONDARY)
    fig.text(0.5, 0.934, f'Gerado em {datetime.now().strftime("%d/%m/%Y às %H:%M")}',
             ha='center', va='top', fontsize=9, color=GRAY)

    ax_line = fig.add_axes([0.05, 0.912, 0.90, 0.002])
    ax_line.set_facecolor(ACCENT)
    ax_line.set_xticks([])
    ax_line.set_yticks([])
    for s in ax_line.spines.values():
        s.set_visible(False)

    gs = gridspec.GridSpec(3, 4, figure=fig,
                           top=0.896, bottom=0.07,
                           left=0.05, right=0.97,
                           hspace=0.55, wspace=0.38)

    def kpi(ax, value, label, sub=None, color=PRIMARY):
        ax.set_facecolor(color)
        for s in ax.spines.values():
            s.set_visible(False)
        ax.set_xticks([])
        ax.set_yticks([])
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        rect = FancyBboxPatch((0, 0), 1, 1, boxstyle='round,pad=0.02',
                              facecolor=color, edgecolor='none', zorder=0)
        ax.add_patch(rect)
        ax.text(0.5, 0.62, value,  ha='center', va='center',
                fontsize=20, fontweight='bold', color=WHITE, zorder=1)
        ax.text(0.5, 0.30, label,  ha='center', va='center',
                fontsize=9, color=ACCENT, zorder=1)
        if sub:
            ax.text(0.5, 0.12, sub, ha='center', va='center',
                    fontsize=7.5, color='#FFD0A8', zorder=1)

    kpi(fig.add_subplot(gs[0, 0]), str(total_pedidos),
        'Total de Pedidos',   f'Desconto concedido: {fmt_brl(total_desconto)}')
    kpi(fig.add_subplot(gs[0, 1]), fmt_brl(faturamento),
        'Faturamento Total',  f'{total_produtos} produtos cadastrados')
    kpi(fig.add_subplot(gs[0, 2]), fmt_brl(ticket_medio),
        'Ticket Médio')
    kpi(fig.add_subplot(gs[0, 3]), str(total_produtos),
        'Produtos Ativos', color=SECONDARY)

    # ── Status dos pedidos ────────────────────────────────────────────────────
    ax_pie = fig.add_subplot(gs[1, 0])
    if len(status_counts):
        sc = {
            'Pendente': WARNING, 'Pago': SUCCESS, 'Em preparo': SECONDARY,
            'Em rota': '#2196F3', 'Entregue': SUCCESS,
            'Cancelado': DANGER, 'Recusado': DANGER,
        }
        colors = [sc.get(s, GRAY) for s in status_counts.index]
        _, _, autos = ax_pie.pie(
            status_counts.values, labels=status_counts.index,
            autopct='%1.0f%%', colors=colors, startangle=90,
            textprops={'fontsize': 7.5, 'color': PRIMARY},
            wedgeprops={'edgecolor': WHITE, 'linewidth': 1.5},
        )
        for at in autos:
            at.set_color(WHITE)
            at.set_fontsize(8)
            at.set_fontweight('bold')
    ax_pie.set_title('Status dos Pedidos', color=PRIMARY, fontsize=11, fontweight='bold', pad=10)

    # ── Produtos mais vendidos ────────────────────────────────────────────────
    ax_bar = fig.add_subplot(gs[1, 1:3])
    if not mais_vendidos.empty:
        top = mais_vendidos.sort_values('total_vendido', ascending=False).head(6)
        nomes = [n if len(n) <= 18 else n[:16] + '…' for n in top['nome'].values[::-1]]
        bars = ax_bar.barh(nomes, top['total_vendido'].values[::-1],
                           color=PALETTE[:len(top)], edgecolor=WHITE,
                           linewidth=0.8, height=0.6)
        ax_bar.set_xlabel('Unidades vendidas', fontsize=9, color=PRIMARY)
        ax_bar.set_title('Produtos Mais Vendidos', color=PRIMARY, fontsize=11, fontweight='bold')
        ax_bar.tick_params(labelsize=8, colors=PRIMARY)
        ax_bar.spines['left'].set_color('#E0D0C0')
        ax_bar.spines['bottom'].set_color('#E0D0C0')
        for bar in bars:
            w = bar.get_width()
            ax_bar.text(w + 0.05, bar.get_y() + bar.get_height() / 2,
                        str(int(w)), va='center', fontsize=8,
                        color=PRIMARY, fontweight='bold')
        ax_bar.grid(axis='y', alpha=0)

    # ── Métodos de pagamento ──────────────────────────────────────────────────
    ax_pag = fig.add_subplot(gs[1, 3])
    if len(pagamentos):
        ax_pag.pie(pagamentos.values, labels=pagamentos.index,
                   colors=PALETTE, startangle=90,
                   textprops={'fontsize': 7.5, 'color': PRIMARY},
                   wedgeprops={'edgecolor': WHITE, 'linewidth': 1.5})
        ax_pag.set_title('Pagamentos', color=PRIMARY, fontsize=11, fontweight='bold', pad=10)

    # ── Receita por produto ───────────────────────────────────────────────────
    ax_fat = fig.add_subplot(gs[2, 0:2])
    if not mais_vendidos.empty and 'receita' in mais_vendidos.columns:
        receita = mais_vendidos.sort_values('receita', ascending=False).head(6)
        x = range(len(receita))
        bars2 = ax_fat.bar(x, receita['receita'].values,
                           color=PALETTE[:len(receita)], edgecolor=WHITE,
                           linewidth=0.8, width=0.6)
        ax_fat.set_xticks(list(x))
        ax_fat.set_xticklabels(
            [n[:14] + '…' if len(n) > 14 else n for n in receita['nome'].values],
            rotation=18, ha='right', fontsize=8,
        )
        ax_fat.tick_params(axis='y', labelsize=8, colors=PRIMARY)
        ax_fat.set_title('Receita por Produto', color=PRIMARY, fontsize=11, fontweight='bold')
        ax_fat.yaxis.set_major_formatter(
            plt.FuncFormatter(lambda v, _: f'R${v:,.0f}'.replace(',', '.'))
        )
        max_val = receita['receita'].max()
        for bar in bars2:
            h = bar.get_height()
            ax_fat.text(bar.get_x() + bar.get_width() / 2, h + max_val * 0.01,
                        fmt_brl(h), ha='center', fontsize=7, color=PRIMARY, fontweight='bold')

    # ── Receita por categoria ─────────────────────────────────────────────────
    ax_cat = fig.add_subplot(gs[2, 2:4])
    ax_cat.set_title('Receita por Categoria', color=PRIMARY, fontsize=11, fontweight='bold')
    if len(categorias):
        ax_cat.bar(categorias.index, categorias.values,
                   color=PALETTE[:len(categorias)], edgecolor=WHITE, linewidth=0.8, width=0.5)
        ax_cat.tick_params(axis='x', labelsize=9, colors=PRIMARY)
        ax_cat.tick_params(axis='y', labelsize=8, colors=PRIMARY)
        ax_cat.yaxis.set_major_formatter(
            plt.FuncFormatter(lambda v, _: f'R${v:,.0f}'.replace(',', '.'))
        )
    else:
        ax_cat.set_xticks([])
        ax_cat.set_yticks([])
        ax_cat.text(0.5, 0.5, 'Sem dados de categoria', ha='center', va='center',
                    fontsize=10, color=GRAY, transform=ax_cat.transAxes)

    # ── Salvar ────────────────────────────────────────────────────────────────
    out_png = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dashboard_velvetslice.png')
    plt.savefig(out_png, dpi=150, bbox_inches='tight', facecolor=BG)
    print(f'PNG salvo em: {out_png}')

    if export_pdf:
        out_pdf = out_png.replace('.png', '.pdf')
        with PdfPages(out_pdf) as pdf:
            pdf.savefig(fig, bbox_inches='tight', facecolor=BG)
            d = pdf.infodict()
            d['Title'] = 'Velvet Slice — Dashboard de Vendas'
            d['Author'] = 'Velvet Slice'
            d['CreationDate'] = datetime.now()
        print(f'PDF salvo em: {out_pdf}')

    plt.show()
    plt.close()


if __name__ == '__main__':
    export = '--pdf' in sys.argv
    build_dashboard(export_pdf=export)
    if export:
        print('\nPara exportar apenas PNG:  python dashboard.py')
        print('Para exportar PNG + PDF:   python dashboard.py --pdf')
