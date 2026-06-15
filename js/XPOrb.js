export class XPOrb {
    constructor(x, y, amount) {
        this.x = x;
        this.y = y;
        this.amount = amount;
        this.radius = 6;
        const hue = (x * 0.1 + y * 0.1 + amount * 30) % 360;
        this.color = `hsl(${hue}, 100%, 50%)`;
        this.magnetized = false;
        this.collected = false;
        this.bobOffset = Math.random() * Math.PI * 2;
    }

    update(player) {
        this.bobOffset += 0.05;
        
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        if (dist < 150) {
            this.magnetized = true;
        }
        
        if (this.magnetized) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distance = Math.hypot(dx, dy);
            if (distance > 0) {
                const speed = Math.min(12, 8 + (150 - distance) * 0.05);
                this.x += (dx / distance) * speed;
                this.y += (dy / distance) * speed;
            }
        }
    }

    render(ctx) {
        const bob = Math.sin(this.bobOffset) * 2;
        
        ctx.beginPath();
        ctx.arc(this.x, this.y + bob, this.radius + 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color + '40';
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(this.x, this.y + bob, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    isCollected(player) {
return Math.hypot(player.x - this.x, player.y - this.y) < player.radius + this.radius;    }
}