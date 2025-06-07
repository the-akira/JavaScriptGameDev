## S — Single Responsibility Principle (Princípio da Responsabilidade Única)

Cada classe ou módulo possui uma única responsabilidade clara:

- **Vector2D**: lida apenas com operações vetoriais (posição e movimento).

- **InputManager**: cuida exclusivamente da entrada do usuário.

- **MatrixEffect**: responsável por desenhar o efeito visual de fundo estilo "Matrix".

- **Player**, **Enemy**, **Projectile**, **ParticleSystem**: cada uma cuida exclusivamente do seu papel no jogo (movimentação, tiro, renderização, etc.).

## O — Open/Closed Principle (Princípio Aberto/Fechado)

As classes estão abertas para extensão, mas fechadas para modificação:

- A classe **Enemy** serve como base, e novos tipos de inimigos (como **BossEnemy**) são criados herdando dela.

- Projéteis (**Projectile**, **PlayerBullet**, **EnemyBullet**) também seguem esse padrão.

- O método **getColorByType()** permite variação de comportamento com base no tipo sem precisar alterar a lógica central.

## L — Liskov Substitution Principle (Princípio da Substituição de Liskov)

Classes derivadas podem ser utilizadas no lugar das classes base sem quebrar a funcionalidade:

- **PlayerBullet** e **EnemyBullet** herdam de **Projectile** e podem ser usados em qualquer parte do código que espera um **Projectile**.

- **BossEnemy** substitui **Enemy** sem afetar o funcionamento da engine.

## I — Interface Segregation Principle (Princípio da Segregação de Interfaces)

O código define interfaces específicas com métodos bem definidos:

- **Drawable**: para objetos que precisam ser desenhados.

- **Movable**: para objetos que se movimentam.

- **Collidable**: para objetos que colidem.

Essas "interfaces" são simuladas com classes abstratas e métodos a serem implementados. As classes concretas implementam apenas as interfaces necessárias, promovendo um design limpo e modular.

## D — Dependency Inversion Principle (Princípio da Inversão de Dependência)

A classe principal **Game** não depende diretamente de implementações concretas, mas de abstrações:

- Usa abstrações como **InputManager**, **ParticleSystem**, **Player**, **Enemy**, **Projectile**.

- A lógica do jogo se baseia em interfaces e contratos de comportamento, e não em detalhes de implementação específicos.

Isso permite maior flexibilidade e testes mais fáceis (poderia-se injetar mocks ou classes de teste, por exemplo).
