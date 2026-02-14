import psycopg2
import xml.etree.ElementTree as ET

def load_xml_file(file_path):
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
        return root
    except ET.ParseError as e:
        print(f"Error parsing XML file: {e}")
        return None

xmlfile = load_xml_file("24405.xml")

connection = None
try:
    connection = psycopg2.connect(
        host="localhost",
        database="gotofoods",
        user="gotofoods",
        password="gotofoodspassword123",
        port=5432
    )
except Exception as e:
    print(f"An error occurred: {e}")

cursor = connection.cursor()

def insert_modifiers(optiongroup, parent_product = None, parent_option = None):
    cursor.execute(
        "INSERT INTO option_group (id, brand_id, name, description, mandatory, supports_choice_quantities, choice_quantity_increment, explanation_text, sort_order) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) "
        "ON CONFLICT (id) DO UPDATE SET brand_id = EXCLUDED.brand_id, name = EXCLUDED.name, description = EXCLUDED.description, mandatory = EXCLUDED.mandatory, supports_choice_quantities = EXCLUDED.supports_choice_quantities, choice_quantity_increment = EXCLUDED.choice_quantity_increment, explanation_text = EXCLUDED.explanation_text, sort_order = EXCLUDED.sort_order",
        (optiongroup.get('chainid'), xmlfile.attrib['brandid'], optiongroup.get('name'), optiongroup.get('description'), optiongroup.get('mandatory'), optiongroup.get('supportschoicequantities'), optiongroup.get('choicequantityincrement'), optiongroup.get('explanationtext'), optiongroup.get('sortorder'))
    )
    if parent_product:
        cursor.execute(
            "INSERT INTO product_option_group_link (product_id, option_group_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (parent_product.get('id'), optiongroup.get('chainid'))
        )
    if parent_option:
        cursor.execute(
            "INSERT INTO option_option_group_link (option_id, option_group_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (parent_option.get('chainid'), optiongroup.get('chainid'))
        )
    for option in optiongroup.find(".options").findall(".option"):
        cursor.execute(
            "INSERT INTO option (id, brand_id, name, is_default, cost, adjusts_parent_calories, adjusts_parent_price, sort_order, price) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) "
            "ON CONFLICT (id) DO UPDATE SET brand_id = EXCLUDED.brand_id, name = EXCLUDED.name, is_default = EXCLUDED.is_default, cost = EXCLUDED.cost, adjusts_parent_calories = EXCLUDED.adjusts_parent_calories, adjusts_parent_price = EXCLUDED.adjusts_parent_price, sort_order = EXCLUDED.sort_order, price = EXCLUDED.price",
            (option.get('chainid'), xmlfile.attrib['brandid'], option.get('name'), option.get('isdefault'), option.get('cost'), option.get('adjustsparentcalories'), option.get('adjustsparentprice'), option.get('sortorder'), option.find('.pricing').find('.price').text)
        )
        cursor.execute(
            "INSERT INTO option_group_option_link (option_group_id, option_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (optiongroup.get('chainid'), option.get('chainid'))
        )
        if option.find(".modifiers"):
            for inner_optiongroup in option.find(".modifiers").findall(".optiongroup"):
                insert_modifiers(inner_optiongroup, parent_option=option)

for category in xmlfile.find(".menu").find(".categories"):
    cursor.execute(
        "INSERT INTO category (id, brand_id, name, extref, sortorder) VALUES (%s, %s, %s, %s, %s) ON CONFLICT (id) DO UPDATE SET brand_id = EXCLUDED.brand_id, name = EXCLUDED.name, extref = EXCLUDED.extref, sortorder = EXCLUDED.sortorder",
        (category.get('id'), xmlfile.attrib['brandid'], category.get('name'), category.get('extref'), category.get('sortorder'),))
    for product in category.find(".products"):
        cursor.execute(
            "INSERT INTO product (id, brand_id, category_id, chainproduct_id, name, description, cost, base_calories, max_calories, extref, is_disabled, minimum_quantity, quantity_increment, short_description, calories_separator, sort_order, price) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s) "
            "ON CONFLICT (id) DO UPDATE SET brand_id = EXCLUDED.brand_id, category_id = EXCLUDED.category_id, chainproduct_id = EXCLUDED.chainproduct_id, name = EXCLUDED.name, description = EXCLUDED.description, cost = EXCLUDED.cost, base_calories = EXCLUDED.base_calories, max_calories = EXCLUDED.max_calories, extref = EXCLUDED.extref, is_disabled = EXCLUDED.is_disabled, minimum_quantity = EXCLUDED.minimum_quantity, quantity_increment = EXCLUDED.quantity_increment, short_description = EXCLUDED.short_description, calories_separator = EXCLUDED.calories_separator, sort_order = EXCLUDED.sort_order, price = EXCLUDED.price",
            (product.get('id'), xmlfile.attrib['brandid'], category.get('id'), product.get('chainproductid'), product.get('name'), product.get('description'), product.get('cost'), product.get('basecalories'), product.get('maxcalories'), product.get('extref'), product.get('isdisabled'), product.get('minimumquantity'), product.get('quantityincrement'), product.get('shortdescription'), product.get('cost'), product.get('sortorder'), product.find('.pricing').find('.price').text))
        for optiongroup in product.find(".modifiers").findall(".optiongroup"):
            insert_modifiers(optiongroup, parent_product=product)

connection.commit()
