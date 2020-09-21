const express = require("express");
const PORT = process.env.PORT || 5000;
const { graphqlHTTP } = require("express-graphql");
const {
	GraphQLObjectType,
	GraphQLSchema,
	GraphQLString,
	GraphQLList,
	GraphQLNonNull,
	GraphQLInt,
} = require("graphql");
const { GraphQLJSON } = require("graphql-type-json");
const { Client } = require("pg");

require("dotenv").config();

const app = express();

//Connect to postgres db
const client = new Client({
	connectionString: process.env.DB_URI,
	ssl: {
		rejectUnauthorized: false,
	},
});
client
	.connect()
	.then(() => console.log(`Connected to db`))
	.catch((err) => console.log(err));

client
	.query(
		`
		SELECT * FROM tutorials
		`
	)
	.then((res) => console.log(res))
	.catch((err) => console.log(err));

//graphql route
const QueryRoot = new GraphQLObjectType({
	name: "Query",
	fields: () => ({
		hello: {
			type: GraphQLString,
			resolve: () => "Hello world!",
		},
		tutorials: {
			type: new GraphQLList(Tutorial),
			resolve: async () => {
				const res = await client.query("SELECT * from tutorials");
				return res.rows
			},
		},
		tutorial: {
			type: Tutorial,
			args: { slug: { type: GraphQLNonNull(GraphQLString) } },
			resolve: async (parent, args) => {
				const res = await client.query(
					`SELECT * from tutorials WHERE slug = '${args.slug}'`
				);
				return res.rows[0];
			},
		},
		category: {
			type: new GraphQLList(Tutorial),
			args: { category: { type: GraphQLNonNull(GraphQLString) } },
			resolve: async (parent, args) => {
				const res = await client.query(
					`SELECT * from tutorials WHERE category = '${args.category}'`
				);
				return res.rows;
			},
		},
	}),
});

const Tutorial = new GraphQLObjectType({
	name: "Tutorial",
	fields: () => ({
		id: { type: GraphQLString },
		name: { type: GraphQLString },
		title: { type: GraphQLString },
		slug: { type: GraphQLString },
		slides: { type: GraphQLJSON },
		redirect: { type: GraphQLJSON },
		category: { type: GraphQLString },
	}),
});

const MutationRoot = new GraphQLObjectType({
	name: "Mutation",
	fields: () => ({
		addTutorial: {
			type: Tutorial,
			args: {
				id: { type: GraphQLNonNull(GraphQLInt) },
				name: { type: GraphQLNonNull(GraphQLString) },
				title: { type: GraphQLNonNull(GraphQLString) },
				slug: { type: GraphQLNonNull(GraphQLString) },
				slides: { type: GraphQLNonNull(GraphQLJSON) },
				redirect: { type: GraphQLJSON },
				category: { type: GraphQLNonNull(GraphQLString) },
			},
			resolve: async (parent, args, context, resolveInfo) => {
				try {
					return (
						await client.query(
							"INSERT INTO tutorials (id, name, title, slug, redirect, category, slides) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
							[
								args.id,
								args.name,
								args.title,
								args.slug,
								args.redirect,
								args.category,
								JSON.stringify(args.slides),
							]
						)
					).rows[0];
				} catch (err) {
					console.log(err);
					throw new Error("Failed to insert new tutorial");
				}
			},
		},
	}),
});

const schema = new GraphQLSchema({ query: QueryRoot, mutation: MutationRoot });

app.use(
	"/graphql",
	graphqlHTTP({
		schema,
		graphiql: true,
	})
);

app.listen(PORT, () => console.log(`Server up and running on port ${PORT}`));