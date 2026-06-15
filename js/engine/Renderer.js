export class Renderer {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
    }

    clear() {
        this.ctx.fillStyle = '#16213e';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // В будущем добавим сюда методы для отрисовки кругов, сетки и т.д.
}