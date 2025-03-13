const mongooseUtil = require('../utils/MongooseUtil');
const Models = require('./Models');
const express = require('express');
const router = express.Router();
const JwtUtil = require('../utils/JwtUtil');
const ProductDAO = require('../models/ProductDAO');

// Category DAO Object definition
const CategoryDAO = {
    // Method to get all categories
    async selectAll() {
        const query = {};
        const categories = await Models.Category.find(query).exec();
        return categories;
    },

    // Method to insert a new category
    async insert(category) {
        const mongoose = require('mongoose');
        category._id = new mongoose.Types.ObjectId(); // Create a new ID for the category
        const result = await Models.Category.create(category);
        return result;
    },
    async getTopCategories(startDate, endDate) {
        try {
            // Convert string dates to Date objects
            const start = new Date(startDate);
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
    
            // First, get all categories
            const categories = await this.selectAll();
            
            // Create a map to count products per category
            const categoryCounts = {};
            categories.forEach(category => {
                categoryCounts[category._id.toString()] = {
                    name: category.name,
                    count: 0
                };
            });
            
            // Get all products and count them per category
            const products = await Models.Product.find().populate('category', 'name').lean();
            
            products.forEach(product => {
                if (product.category && product.category._id) {
                    const categoryId = product.category._id.toString();
                    if (categoryCounts[categoryId]) {
                        categoryCounts[categoryId].count++;
                    }
                }
            });
            
            // Convert to array and sort by count
            const result = Object.values(categoryCounts)
                .filter(category => category.count > 0)
                .sort((a, b) => b.count - a.count);
            
            return result;
        } catch (error) {
            console.error('Error in getTopCategories:', error);
            throw new Error(`Error getting top categories: ${error.message}`);
        }
    },

    // Method to update a category
    async update(id, updateData) {
        try {
            const result = await Models.Category.findByIdAndUpdate(
                id,
                updateData,
                { 
                    new: true,  // Return the updated document
                    runValidators: true  // Run validators during the update
                }
            );
            
            if (!result) {
                throw new Error('Category not found');
            }
            
            return result;
        } catch (error) {
            throw new Error(`Error updating category: ${error.message}`);
        }
    },

    // Method to delete a category by ID
    async delete(categoryId) {
        try {
            const result = await Models.Category.findByIdAndDelete(categoryId);
            if (!result) {
                throw new Error('Category not found');
            }
            return result; // Return the result of the deletion
        } catch (error) {
            throw new Error(`Error deleting category: ${error.message}`);
        }
    },

    // Method to get a category by ID
    async selectById(_id) {
        try {
            const category = await Models.Category.findById(_id).exec();
            if (!category) {
                throw new Error('Category not found');
            }
            return category;
        } catch (error) {
            throw new Error(`Error fetching category: ${error.message}`);
        }
    },

    // Method to get random categories with products
    async getRandomCategories(limit) {
        try {
            return await Models.Category.aggregate([
                { $sample: { size: limit } },
                {
                    $lookup: {
                        from: 'products',
                        localField: '_id',
                        foreignField: 'category',
                        as: 'products'
                    }
                },
                // Only include categories that have products
                { $match: { 'products.0': { $exists: true } } }
            ]);
        } catch (error) {
            throw new Error(`Error fetching random categories: ${error.message}`);
        }
    }
};

// Exporting the CategoryDAO
module.exports = CategoryDAO;
