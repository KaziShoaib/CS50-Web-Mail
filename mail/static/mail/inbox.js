document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', () => compose_email());

  // By default, load the inbox
  load_mailbox('inbox');

  document.querySelector('#compose-form').onsubmit = send_email;
});


function compose_email(recipients_list='', subject='', email_body='') {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-detail').style.display = 'none';

  // Clear out composition fields
  //console.log("blank parameter " + content_blank);
  
  document.querySelector('#compose-recipients').value = recipients_list;
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = email_body;
  
  
}


function add_child_to_parent(parent_element, child_element, child_class, content){
  child = document.createElement(child_element);
  child.className = child_class;
  child.innerHTML = content;
  parent_element.append(child);
  return child;
}


function show_email(email_id){
  //alert(`email no. ${email_id}`);
  
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'block';

  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      //console.log(email);
      
      fetch(`/emails/${email_id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      });

      detail_box = document.querySelector('#email-detail');
      detail_box.innerHTML = '';
      
      add_child_to_parent(detail_box, 'h3', '', email.subject);
      sender_email = add_child_to_parent(detail_box, 'p', 'text-primary', `from : ${email.sender}`);
      recipients = email.recipients.join();
      add_child_to_parent(detail_box, 'p', 'text-primary', `to : ${recipients}`);
      add_child_to_parent(detail_box, 'p', 'font-italic text-muted', `on : ${email.timestamp}`);
      add_child_to_parent(detail_box, 'hr', '', '');add_child_to_parent(detail_box, 'p', '', email.body);

      for(i=1; i<=3; i++){
        add_child_to_parent(detail_box, 'br', '', '');
      }

      reply_button = add_child_to_parent(detail_box, 'button', 'btn btn-primary mr-3', 'reply');
      reply_button.onclick = () => {
        recipient_email = email.sender;
        reply_subject = email.subject;
        if(!reply_subject.startsWith('Re: ')){
          reply_subject = 'Re: ' + reply_subject;
        }
        reply_email_content = `On ${email.timestamp} ${email.sender} wrote : \n${email.body}\n`;
        compose_email(recipient_email, reply_subject, reply_email_content);
      };

      // archive unarchive button
      if('from : ' + document.querySelector('#logged-in-user-email').innerHTML != sender_email.innerHTML)
      {
        if(email.archived === false){
          archive_unarchive_button = add_child_to_parent(detail_box, 'button', 'btn btn-warning', 'archive');
        }
        else{
          archive_unarchive_button = add_child_to_parent(detail_box, 'button', 'btn btn-success', 'unarchive');
        }
        archive_unarchive_button.onclick = () => {
          
          fetch(`/emails/${email_id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: !email.archived
            })
          })
          .then(()=>load_mailbox('inbox'));
        };
      }
  });

}


function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  //get all the emails for a particular mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    let list_group = document.createElement('div');
    list_group.className = "list-group";
    for(index in emails){
      email = emails[index];

      //console.log(email);

      list_group_item = document.createElement('div');
      list_group_item.className = "list-group-item";

      list_group_row = document.createElement('div');
      list_group_row.className = "row";

      sender = document.createElement('a');
      sender.setAttribute("href","#");
      sender.className = "col-3 font-weight-bold text-left";
      if(mailbox === 'sent')
      {
        sender.innerHTML = 'To : ' + email.recipients[0] + '....';  
      }
      else
      {
        sender.innerHTML = email.sender;
      }
      
      sender.id = email.id;
      sender.addEventListener('click',event=>show_email(event.target.id));
      
      subject = document.createElement('a');
      subject.setAttribute("href","#");
      subject.className = "col-6 font-weight-bold text-center";
      subject.innerHTML = 'Subject : ' + email.subject;
      subject.id = email.id;
      subject.addEventListener('click',event=>show_email(event.target.id));

      timestamp = document.createElement('div');
      timestamp.className = "col-3 font-italic text-right";
      timestamp.innerHTML = email.timestamp;

      list_group_row.append(sender);
      list_group_row.append(subject);
      list_group_row.append(timestamp);

      list_group_item.append(list_group_row);
      
      if(email.read == false){
        list_group_item.style['background-color'] = "#FFFFFF";
      }
      else{
        list_group_item.style['background-color'] = "#DCDCDC";
      }
      list_group.append(list_group_item);
    }
    document.querySelector('#emails-view').append(list_group);
    // ... do something else with emails ...
  });
  
  
}


function launch_modal(text_color, message_heading, message_content){
  document.querySelector('#message-heading').className =  text_color;
  document.querySelector('#message-heading').innerHTML = message_heading;
  document.querySelector('#message-body').className = text_color;
  document.querySelector('#message-body').innerHTML = message_content;
  $('#message-modal').modal();
}


function send_email(){
  recipients = document.querySelector('#compose-recipients').value;
  subject = document.querySelector('#compose-subject').value;
  body = document.querySelector('#compose-body').value;
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      //console.log(result);
      if(result.message === undefined){
        launch_modal("text-danger", "Error", result.error);
        //alert(`${result.error}`);
        compose_email(recipients, subject, body);
      }
      else{
        launch_modal("text-primary","Success", result.message);
        //alert(`${result.message}`);
        load_mailbox('sent');
      }
      
  });
  return false;
}