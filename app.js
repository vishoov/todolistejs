const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const mongoose=require("mongoose")

const _ = require("lodash")

app.set("view engine", "ejs"); // Use app.set to set the view engine
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));


mongoose.connect("mongodb+srv://admin-vishoo:MongoCluster0@cluster0.nbcwf1v.mongodb.net/todolistDB", {useNewUrlParser: true});

const itemsSchema={
    name:String
};

const Item = mongoose.model("Item", itemsSchema);

const item1= new Item({
    name:"Welcome to your todolist"
});

const item2= new Item({
    name:"Hit the + button to add a new item "
});
const item3= new Item({
    name:"<-- Hit this to delete an item"
});

const defaultitems=[item1, item2, item3];

const listSchema={
    name:String,
    items:[itemsSchema]
};

const List = mongoose.model("List", listSchema)

app.get("/", function(req, res) {
    
    
    
    // Assuming 'Item' is your Mongoose model

Item.find({}) // Building the query
.then(foundItems => {
  if (foundItems.length === 0) {
    return Item.insertMany(defaultitems); // Insert default items if none found
  }
  return foundItems; // Otherwise, return the found items
})
.then(result => {
  if (Array.isArray(result)) {
    // Found items, render them
    res.render("List", { listTitle: "Today", newlistItems: result });
  } else {
    console.log("Successfully initiated default items");
    // Successfully inserted default items, perform additional actions if needed
    // After this action, you might want to query the items again and render them
  }
})
.catch(error => {
  console.error(error);
  // Handle any errors that occur during the process
});

    

});

app.post("/", function(req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if (listName === "Today") {
        item.save();
        res.redirect("/");
    } else {
        List.findOne({ name: listName })
            .then((foundList) => {
                if (foundList) {
                    foundList.items.push(item);
                    return foundList.save();
                } else {
                    // If the list doesn't exist, handle it accordingly
                    throw new Error('List not found');
                }
            })
            .then(() => {
                res.redirect("/" + listName); // Redirect after adding the item
            })
            .catch((err) => {
                console.error(err);
                res.status(500).send('Error adding item to the list');
            });
    }
});

// Assuming you have a model named 'Item' defined using Mongoose

app.post("/delete", async (req, res) => {
    const itemIdToDelete = req.body.checkbox;
    const listName = req.body.listName;

    if (listName === "Today") {
        try {
            const deletedItem = await Item.findOneAndDelete({ _id: itemIdToDelete });
            if (!deletedItem) {
                return res.status(404).send('Item not found');
            }
            console.log('Item deleted successfully');
            return res.redirect('/');
        } catch (error) {
            console.error('Error deleting item:', error);
            return res.status(500).send('Error deleting item');
        }
    } else {
        try {
            const foundList = await Item.findOne({ name: listName });
            if (!foundList) {
                return res.status(404).send('List not found');
            }

            foundList.items.pull({ _id: itemIdToDelete }); // Assuming 'items' is the array field in your list document
            await foundList.save();

            console.log('Item deleted from list successfully');
            return res.redirect("/" + listName);
        } catch (error) {
            console.error('Error updating list:', error);
            return res.status(500).send('Error updating list');
        }
    }
});


  
  app.get("/:customListName", function(req, res) {
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName })
        .then((foundList) => {
            if (!foundList) {
                console.log("Doesn't Exist");
                const list = new List({
                    name: customListName,
                    items: defaultitems
                });
                return list.save().then(() => {
                    console.log("Custom list created successfully");
                    res.redirect('/' + customListName); // Redirect after creating the list
                });
            } else {
                console.log("Exists");
                res.render("list", {listTitle: foundList.name, newlistItems:foundList.items})
            }
        })
        .catch((err) => {
            console.log(err);
            // Handle errors appropriately
            res.status(500).send('Error creating or retrieving custom list');
        });
});



 


app.listen(3000, function() {
  console.log("Server is up on port 3000");
});
 