var templates = {},
    list;

$("[type='text/x-handlebars']").each(function() {
  var $t = $(this);
  templates[$t.attr("id")] = Handlebars.compile($t.html());
});

Handlebars.registerPartial("contact", $("#contact_template").html());
Handlebars.registerPartial("tag", $("#tag_template").html());

Handlebars.registerHelper("select", function( values, options ){
  var $el = $("<select />").html( options.fn(this) );

  if (values) {
    values.forEach(function(value) {
      if (values.indexOf(value) > -1) {
        $el.find('[value="' + value + '"]').attr({'selected':'selected'});
      }
    });
  } else {
    $el.find('[value="all"]').attr({'selected':'selected'});
  }

  return $el.html();
});

(function () {
  list = {
    last_id: 0,
    collection: [],
    tags_collection: [{ tag: "all" }],
    all_collection: [],
    active_tag: "all",
    $contacts: $("#contacts ul"),
    $contact_edit: $("#edit"),
    $container: $("#container"),
    renderContact: function() {
      this.$contacts.html(templates.contacts_template({ contacts: this.collection }));
      this.activeTag();
    },
    activeTag: function() {
      var tags = this.$contacts.find(".tags").removeClass("active"),
          self = this;

      tags.each(function(idx, tag) {
        if ($(tag).text() === self.active_tag) {
          $(tag).addClass("active");
        }
      });
    },
    newContact: function(e) {
      e.preventDefault();

      this.$container.hide();
      this.$contact_edit.show().html($(templates.contact_edit()));
      this.$contact_edit.find("select").html($(templates.tags_template( {tags: this.tags_collection} )));

      this.$contact_edit.unbind("submit");
      this.$contact_edit.on("submit", "form", $.proxy(this.addContact, this));
    },
    addContact: function(e) {
      e.preventDefault();
      this.last_id += 1;
      var $form = $(e.target),
          tags = $form.find("[name=tags]").val() || ["all"],
          new_tag = $form.find("[name=new_tag]").val(),
          contact = {
            id: this.last_id
          }

      contact.name = $form.find("[name=contact_name]").val();
      contact.number = $form.find("[name=contact_number]").val();
      contact.email = $form.find("[name=contact_email]").val();

      if (tags.length !== 0) { contact.tags = ["all"].concat(tags); }
      if (/\w+/.test(new_tag)) {
        contact.tags.push(new_tag);
        if (this.tags_collection.indexOf(new_tag) === -1) {
          this.tags_collection.push( {tag: new_tag} );
        }
      }

      contact.all_tags = this.tags_collection;
      contact.tags = this.unique(contact.tags);
      this.all_collection.push(contact);

      if (this.collection.length === 0) {
        this.collection = this.all_collection;
      } else {
        this.collection = this.filterTag();
      }

      localStorage.setItem("list", JSON.stringify(this));
      this.closeContact();
    },
    closeContact: function() {
      this.$contact_edit.hide();
      this.$container.show();
      this.renderContact();
    },
    remove: function($contact) {
      var id = this.findID($contact),
          contact = this.get(id);

      this.all_collection = this.all_collection.filter(function(contact) {
        return contact.id !== id;
      });

      this.collection = this.collection.filter(function(contact) {
        return contact.id !== id;
      });

      localStorage.setItem("list", JSON.stringify(this));
    },
    deleteContact: function(e) {
      e.preventDefault();
      var $contact = this.findParent(e).remove();

      this.remove($contact);
      this.renderContact();
    },
    editContact: function(e) {
      e.preventDefault();
      var $contact = this.findParent(e),
          id = this.findID($contact),
          contact = this.get(id);

      this.$container.hide();
      this.$contact_edit.show().html($(templates.contact_edit(contact)));

      this.$contact_edit.unbind("submit");
      this.$contact_edit.on("submit", "form", $.proxy(this.updateContact, this));
    },
    cancelEdit: function(e) {
      e.preventDefault();

      this.$contact_edit.hide();
      this.$container.show();
      this.renderContact();
    },
    findID: function($contact) {
      return +$contact.attr("data-id") || +$contact.find("[name=contact_id]").val();
    },
    get: function(id) {
      var found_contact;
      this.all_collection.forEach(function(contact) {
        if (contact.id === id) {
          found_contact = contact;
          return false;
        }
      });
      return found_contact;
    },
    findParent: function(e) {
      return $(e.target).closest("li");
    },
    updateContact: function(e) {
      e.preventDefault();
      var $form = $(e.target),
          tags = $form.find("[name=tags]").val(),
          new_tag = $form.find("[name=new_tag]").val(),
          id = this.findID($form),
          contact = this.get(id);

      if (!tags) { tags = contact.tags; }

      contact.name = $form.find("[name=contact_name]").val();
      contact.number = $form.find("[name=contact_number]").val();
      contact.email = $form.find("[name=contact_email]").val();

      if (tags.length !== 0) { contact.tags = ["all"].concat(tags); }
      if (/\w+/.test(new_tag)) {
        contact.tags.push(new_tag);
        if (this.tags_collection.indexOf(new_tag) === -1) {
          this.tags_collection.push( {tag: new_tag} );
        }
      }

      contact.all_tags = this.tags_collection;
      contact.tags = this.unique(contact.tags);

      localStorage.setItem("list", JSON.stringify(this));
      this.closeContact();
    },
    unique: function(array) {
      return array.filter(function(el, idx) {
        return array.indexOf(el) === idx;
      });
    },
    switchTag: function(e) {
      e.preventDefault();
      var tag = $(e.target).text(),
          self = this;

      this.active_tag = tag;
      this.collection = this.filterTag();

      localStorage.setItem("list", JSON.stringify(this));
      this.renderContact();
    },
    filterTag: function() {
      var self = this;
      return this.all_collection.filter(function(contact) {
        return contact.tags.indexOf(self.active_tag) !== -1;
      });
    },
    searchName: function(e) {
      var name = $(e.target).val();

      if (name.length === 0) {
        this.collection = this.filterTag();
      } else {
        this.collection = this.collection.filter(function(contact) {
          return contact.name.indexOf(name) !== -1;
        });
      }

      localStorage.setItem("list", JSON.stringify(this));
      this.renderContact();
    },
    bindEvent: function() {
      $("#control_panel").on("click", "a", $.proxy(this.newContact, this));
      $("#query").on("input", $.proxy(this.searchName, this));
      this.$contact_edit.on("click", "a.cancel", $.proxy(this.cancelEdit, this));
      this.$contacts.on("click", "a.delete", $.proxy(this.deleteContact, this));
      this.$contacts.on("click", "a.edit", $.proxy(this.editContact, this));
      this.$contacts.on("click", "a.tags", $.proxy(this.switchTag, this));
    },
    retrieveData: function(data) {
      if (data === null) { return; }
      this.last_id = data.last_id;
      this.collection = data.collection;
      this.all_collection = data.all_collection;
      this.tags_collection = data.tags_collection;
      this.active_tag = data.active_tag;
    },
    init: function() {
      this.retrieveData(JSON.parse(localStorage.getItem("list")));
      this.bindEvent();
      this.renderContact();
    }
  };
}());

$($.proxy(list.init(), list));