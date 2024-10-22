import { Hono } from "hono";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { sign, verify } from "hono/jwt";

type Variables = {
    userId : number
}

const routes = new Hono<{
    Bindings: {
        DATABASE_URL: string,
        SECRET_KEY: string
    },
    Variables: Variables
}>();

routes.use('/post/*', async (c, next) => {
    const header = c.req.header('authorization') || "";
    const token = header.split(" ")[1];
    const user = await verify(token, c.env.SECRET_KEY);
    if (user) {
        //@ts-ignore
        c.set('userId', user.id);
        await next();
    } else {
        c.status(403);
        return c.json({
            message: 'unauthorized access'
        })
    }
})

routes.post('/signup', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    const body = await c.req.json();
    await prisma.user.create({
        data: {
            email: body.email,
            password: body.password,
            name: body.name,
        }
    })
    return c.json({
        message: 'success'
    })
});

routes.post('/signin', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const user = await prisma.user.findUnique({
        where: {
            email: body.email,
            password: body.password
        }
    });
    if (!user) {
        return c.json({
            error: 'user not found'
        });
    }
    const token = await sign({ id: user.id }, c.env.SECRET_KEY);
    return c.json({
        jwt: token
    });
});

routes.post('/post', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const userId = c.get('userId');
    const post = await prisma.post.create({
        data: {
            title: body.title,
            content: body.content,
            userId: userId
        }
    });
    return c.json({
        id: post.id
    });
});

routes.put('/post', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const post = await prisma.post.update({
        where: {
            id: body.id
        },
        data: {
            title: body.title,
            content: body.content
        }
    });
    return c.json({
        id: post.id
    });
});

routes.get('/post', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const post = await prisma.post.findFirst({
        where: {
            id: body.id
        }
    });
    if (!post) {
        c.status(411);
        return c.json({
            error: "post not found"
        })
    }
    return c.json({
        post: post
    });
});

routes.get('/posts', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    const posts = await prisma.post.findMany();
    return c.json({
        posts
    })
})

routes.delete('/post', async (c) => {
    const prisma = new PrismaClient({
        datasourceUrl: c.env.DATABASE_URL
    }).$extends(withAccelerate());

    const body = await c.req.json();
    await prisma.post.delete({
        where: {
            id: body.id
        }
    })
    return c.status(411);
});

export default routes;