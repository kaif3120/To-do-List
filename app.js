
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


//connecting mongoose database todolistDB
mongoose.connect("mongodb+srv://kaif:test123@cluster0.uefs8.mongodb.net/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});


//creating schema and model for items
const itemsSchema = mongoose.Schema({
  name: String
});

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Tap + button to add items"
});
const item2 = new Item({
  name: "check items to remove"
});
const item3 = new Item({
  name: "welcome to the list"
});


//array of defaultItems
const defaultItems = [item3,item1,item2];

// creating schema and model for list
const listSchema = mongoose.Schema(
  {
    name : String,
    item : [itemsSchema]
  }
);

const List = mongoose.model("List", listSchema);



// rendering item on the home page
app.get("/", function(req, res) {

   Item.find({},function(err, foundItems){
     if(foundItems.length === 0){
       Item.insertMany(defaultItems, function(err){
         if (err) {
           console.log(err);
         } else {
           console.log("Sucessfully saved");
         }
         res.redirect("/")
       });
     }else{
     res.render("list", {listTitle: "Today" , newListItems: foundItems});
      }
});
});


//to create new custon name list by ejs templating
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

 List.findOne({name: customListName}, function(err, foundList){
   if (err){
     console.log(err);
   } else{
     if(!foundList){
     const newlist = new List(
       {
         name: customListName,
         item: defaultItems
       }
     );
     newlist.save();
    res.redirect("/"+ customListName);
   }else{
      res.render("list", {listTitle: foundList.name , newListItems: foundList.item});

     }}
 });
});

//posting the item on the current list and home list
app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list
  const item = new Item({
    name: itemName
  });

   if (listName === "Today") {
     item.save();
     res.redirect("/")
   } else {
     List.findOne({name:listName},function(err, foundList){
       foundList.item.push(item);
       foundList.save();
       res.redirect("/"+listName);
     })
   }
});


// for deleting the items when cehckbox is cheked
app.post("/delete",function(req,res){
  const deleteItem = req.body.checkbox;
  const listName = req.body.list;
  if (listName === "Today") {
    Item.deleteOne({_id: deleteItem }, function(err){
      if (err) {
        console.log(err);
      } else {
          res.redirect("/");
      }
    });
  } else {
   List.findOneAndUpdate({name: listName},{$pull : {item: {_id : deleteItem}}},function(err,foundList){
     res.redirect("/"+listName)
   });
  }
});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
