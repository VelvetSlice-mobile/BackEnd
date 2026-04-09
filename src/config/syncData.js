
const products = [
{
  id: 1,
  name: 'Bolo de Chocolate Clássico',
  description: 'Massa fofinha de chocolate com cobertura cremosa e granulado.',
  price: 45.90,
  category: 'choco',
  rating: 4.8
},
{
  id: 2,
  name: 'Bolo Tropical de Frutas',
  description: 'Massa branca leve com recheio de creme e frutas frescas da estação.',
  price: 65.00,
  category: 'Frutas',
  rating: 4.9
},
{
  id: 3,
  name: 'Bolo Red Velvet',
  description: 'O clássico veludo vermelho com recheio autêntico de cream cheese.',
  price: 75.50,
  category: 'Bolo',
  rating: 5.0
},
{
  id: 4,
  name: 'Bolo de Caramelo Salgado',
  description: 'Massa de baunilha com recheio e cobertura de caramelo salgado.',
  price: 55.00,
  category: 'Doces',
  rating: 4.7
},
{
  id: 5,
  name: 'Bolo Caseiro de Laranja',
  description: 'Massa caseira de laranja com cobertura simples de açúcar de confeiteiro.',
  price: 40.00,
  category: 'Frutas',
  rating: 4.6
},
{
  id: 6,
  name: 'Bolo Encanto de Baunilha',
  description: 'Massa de baunilha com recheio de creme e cobertura de chantilly.',
  price: 50.00,
  category: 'Doces',
  rating: 4.8
},
{
  id: 7,
  name: 'Bolo Mel&Amor de Doce de Leite',
  description: 'Massa de doce de leite com recheio e cobertura do mesmo sabor.',
  price: 60.00,
  category: 'Doces',
  rating: 4.9
},
{
  id: 8,
  name: 'Bolo Tropical de Frutas',
  description: 'Massa branca leve com recheio de creme e frutas frescas da estação.',
  price: 65.00,
  category: 'Frutas',
  rating: 4.8
}];



function syncProducts(db) {
  products.forEach((product) => {
    db.run(
      `INSERT OR REPLACE INTO bolo (id_bolo, nome, descricao, preco, imagem) VALUES (?, ?, ?, ?, ?)`,
      [product.id, product.name, product.description, product.price, ''],
      () => {}
    );
  });
}

module.exports = { syncProducts };